import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("PaymentProcessor", function () {
    let paymentProcessor, treasury, lmkt;
    let owner, buyer, seller, otherUser;

    const LISTING_ID = 1;
    const PRICE = ethers.parseEther("1000"); // 1000 LMKT

    beforeEach(async function () {
        [owner, buyer, seller, otherUser] = await ethers.getSigners();

        // Deploy a mock LMKT Token using GenericERC20 for testing
        const LmktFactory = await ethers.getContractFactory("GenericERC20");
        lmkt = await LmktFactory.deploy("Liberty Market Token", "LMKT", 18);

        // Deploy Treasury
        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        // Deploy PaymentProcessor
        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(
            await treasury.getAddress(),
            await lmkt.getAddress()
        );

        // Configure the Treasury with the LMKT address
        await treasury.setLmktAddress(await lmkt.getAddress());

        // Give the buyer enough LMKT to make a purchase
        await lmkt.mint(buyer.address, ethers.parseEther("2000"));
    });

    describe("Deployment", function () {
        it("Should set the correct treasury and lmkt addresses", async function () {
            expect(await paymentProcessor.treasury()).to.equal(await treasury.getAddress());
            expect(await paymentProcessor.lmktToken()).to.equal(await lmkt.getAddress());
        });

        it("Should approve the treasury to spend its LMKT", async function () {
            const allowance = await lmkt.allowance(
                await paymentProcessor.getAddress(),
                await treasury.getAddress()
            );
            expect(allowance).to.equal(ethers.MaxUint256);
        });
    });

    describe("Transaction Lifecycle", function () {
        let totalAmount, totalFee, treasuryShare, sellerFeeShare;

        beforeEach(async function () {
            // Calculate expected amounts
            const feeBase = await paymentProcessor.FEE_BASE();
            const commerceFee = await paymentProcessor.COMMERCE_FEE();
            totalFee = (PRICE * commerceFee) / feeBase; // 0.5% of 1000 = 5
            totalAmount = PRICE + totalFee; // 1005
            treasuryShare = totalFee / 2n; // 2.5
            sellerFeeShare = totalFee - treasuryShare; // 2.5

            // Buyer approves the PaymentProcessor to spend their LMKT
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);

            // Buyer makes the purchase
            await paymentProcessor.connect(buyer).makePurchase(LISTING_ID, PRICE, seller.address);
        });

        it("Should hold the correct amount in escrow after purchase", async function () {
            expect(await lmkt.balanceOf(await paymentProcessor.getAddress())).to.equal(totalAmount);
        });

        it("Should release the correct amounts to the seller and treasury", async function () {
            const initialSellerBalance = await lmkt.balanceOf(seller.address);
            const initialTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());

            // Buyer releases the funds
            await paymentProcessor.connect(buyer).releaseFunds(LISTING_ID);

            // Verify seller's new balance
            const expectedSellerAmount = PRICE + sellerFeeShare;
            expect(await lmkt.balanceOf(seller.address)).to.equal(initialSellerBalance + expectedSellerAmount);

            // Verify treasury's new balance
            expect(await lmkt.balanceOf(await treasury.getAddress())).to.equal(initialTreasuryBalance + treasuryShare);

            // Verify the processor's balance is now zero
            expect(await lmkt.balanceOf(await paymentProcessor.getAddress())).to.equal(0);
        });

        it("Should mark the escrow as released", async function () {
            await paymentProcessor.connect(buyer).releaseFunds(LISTING_ID);
            const escrow = await paymentProcessor.escrows(LISTING_ID);
            expect(escrow.fundsReleased).to.be.true;
        });
    });

    describe("Security and Error Handling", function () {
        beforeEach(async function () {
            const feeBase = await paymentProcessor.FEE_BASE();
            const commerceFee = await paymentProcessor.COMMERCE_FEE();
            const totalFee = (PRICE * commerceFee) / feeBase;
            const totalAmount = PRICE + totalFee;
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);
            await paymentProcessor.connect(buyer).makePurchase(LISTING_ID, PRICE, seller.address);
        });

        it("Should prevent non-buyers from releasing funds", async function () {
            await expect(paymentProcessor.connect(otherUser).releaseFunds(LISTING_ID))
                .to.be.revertedWith("PaymentProcessor: Only buyer can release funds");
        });

        it("Should prevent funds from being released twice", async function () {
            await paymentProcessor.connect(buyer).releaseFunds(LISTING_ID);
            await expect(paymentProcessor.connect(buyer).releaseFunds(LISTING_ID))
                .to.be.revertedWith("PaymentProcessor: Funds already released");
        });
    });
});