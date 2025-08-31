import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("PaymentProcessor", function () {
    let paymentProcessor, listingManager, treasury, lmkt, mockDai, mockOracle;
    let owner, buyer, seller, trustedSigner;

    const LISTING_ID = 1;
    const LISTING_PRICE_USD = 2000 * 10**8; // $2000.00 with 8 decimals

    beforeEach(async function () {
        [owner, buyer, seller, trustedSigner] = await ethers.getSigners();

        // --- Deploy All Contracts in the Ecosystem ---
        const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        mockOracle = await MockOracleFactory.deploy();

        const LmktFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LmktFactory.deploy();

        const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);

        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
        listingManager = await ListingManagerFactory.deploy(
            await treasury.getAddress(),
            await mockDai.getAddress(),
            trustedSigner.address
        );

        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(
            await treasury.getAddress(),
            await listingManager.getAddress(),
            await lmkt.getAddress()
        );

        // --- Configure the Entire System ---

        // 1. Configure Treasury
        await treasury.setLmktAddress(await lmkt.getAddress());
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);
        await mockOracle.setPrice(daiQueryId, 1 * 10**8); // $1.00

        // Fund Treasury with collateral to give LMKT a price
        await mockDai.mint(await treasury.getAddress(), ethers.parseEther("1000000")); // $1M backing

        // 2. Configure Listing Manager (restrict closeListing to PaymentProcessor)
        // Note: For production, you'd add an onlyOwner function to ListingManager
        // to set the PaymentProcessor address for secure, restricted access.

        // 3. Create a Listing for the test
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const nonce = 1;
        const dataIdentifier = "ipfs://item-for-sale";
        const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await listingManager.getAddress() };
        const types = { CreateListing: [{ name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
        const value = { user: seller.address, dataIdentifier, nonce, deadline };
        const signature = await trustedSigner.signTypedData(domain, types, value);
        await mockDai.mint(seller.address, ethers.parseEther("5"));
        await mockDai.connect(seller).approve(await listingManager.getAddress(), ethers.parseEther("5"));
        await listingManager.connect(seller).createListing(0, LISTING_PRICE_USD, dataIdentifier, nonce, deadline, signature);

        // 4. Fund the buyer with LMKT
        await lmkt.mint(buyer.address, ethers.parseEther("5000000"));
    });

    describe("Deployment", function () {
        it("Should set the correct constructor addresses", async function () {
            expect(await paymentProcessor.treasury()).to.equal(await treasury.getAddress());
            expect(await paymentProcessor.listingManager()).to.equal(await listingManager.getAddress());
            expect(await paymentProcessor.lmktToken()).to.equal(await lmkt.getAddress());
        });
    });

    describe("Execute Payment", function () {
        let itemPriceInLmkt, treasuryShare, sellerBonus, totalAmount;

        beforeEach(async function() {
            // Calculate expected LMKT amounts dynamically for the test
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            itemPriceInLmkt = (BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd;

            const feeBase = await paymentProcessor.FEE_BASE();
            const commerceFee = await paymentProcessor.COMMERCE_FEE();
            const totalFeeInLmkt = (itemPriceInLmkt * commerceFee) / feeBase;
            
            treasuryShare = totalFeeInLmkt / 2n;
            sellerBonus = totalFeeInLmkt - treasuryShare;
            totalAmount = itemPriceInLmkt + totalFeeInLmkt;

            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);
        });

        it("Should transfer the correct LMKT amounts to seller and treasury", async function () {
            const initialSellerBalance = await lmkt.balanceOf(seller.address);
            const initialTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());

            await paymentProcessor.connect(buyer).executePayment(LISTING_ID);

            const expectedSellerAmount = itemPriceInLmkt + sellerBonus;
            const finalSellerBalance = await lmkt.balanceOf(seller.address);
            const finalTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());

            expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(treasuryShare);
        });

        it("Should leave the PaymentProcessor with a zero balance (non-custodial)", async function () {
            await paymentProcessor.connect(buyer).executePayment(LISTING_ID);
            expect(await lmkt.balanceOf(await paymentProcessor.getAddress())).to.equal(0);
        });

        it("Should close the listing in the ListingManager after purchase", async function () {
            await paymentProcessor.connect(buyer).executePayment(LISTING_ID);
            const listing = await listingManager.getListing(LISTING_ID);
            expect(listing.status).to.equal(1); // 1 = Inactive
        });

        it("Should emit a PurchaseMade event with correct arguments", async function () {
            await expect(paymentProcessor.connect(buyer).executePayment(LISTING_ID))
                .to.emit(paymentProcessor, "PurchaseMade")
                .withArgs(LISTING_ID, buyer.address, seller.address, totalAmount);
        });
    });

    describe("Security and Error Handling", function () {
        it("Should fail if the listing is not active", async function () {
            // First purchase succeeds and makes the listing inactive
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const totalAmount = ((BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd) * 1005n / 1000n; // Approx. with fee
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount * 2n);
            await paymentProcessor.connect(buyer).executePayment(LISTING_ID);

            // Second attempt should fail
            await expect(paymentProcessor.connect(buyer).executePayment(LISTING_ID))
                .to.be.revertedWith("PaymentProcessor: Listing not active");
        });

        it("Should prevent the seller from buying their own listing", async function () {
            // Mint LMKT to seller and approve
            await lmkt.mint(seller.address, ethers.parseEther("5000000"));
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const totalAmount = ((BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd) * 1005n / 1000n;
            await lmkt.connect(seller).approve(await paymentProcessor.getAddress(), totalAmount);

            await expect(paymentProcessor.connect(seller).executePayment(LISTING_ID))
                .to.be.revertedWith("PaymentProcessor: Cannot buy your own listing");
        });
    });
});