import chai from "chai";
import hardhat from "hardhat";

const { expect } = chai;
const { ethers } = hardhat;

describe("Liberty Market Protocol v4", function () {
    let treasury, lmkt, mockDai, faucet, paymentProcessor;
    let deployer, user1, seller;

    beforeEach(async function () {
        [deployer, user1, seller] = await ethers.getSigners();

        // Deploy Contracts
        const MockDAIFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDAIFactory.deploy("Mock DAI", "DAI", 18);
        
        const LMKTFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LMKTFactory.deploy();
        
        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(await treasury.getAddress(), await lmkt.getAddress());

        // --- Post-Deployment Setup ---
        await treasury.setLmktAddress(await lmkt.getAddress());
        
        const initialSupply = await lmkt.balanceOf(deployer.address);
        await lmkt.connect(deployer).transfer(await treasury.getAddress(), initialSupply);
        
        await lmkt.transferOwnership(await treasury.getAddress());
        
        await paymentProcessor.transferOwnership(seller.address);
        
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        
        // ** FIX: Fund with a large, realistic amount to avoid price errors **
        await mockDai.mint(await treasury.getAddress(), ethers.parseEther("100000000")); // $100M

        // Deploy Faucet and fund user1 for the entire test upfront
        const FaucetFactory = await ethers.getContractFactory("Faucet");
        faucet = await FaucetFactory.deploy(await mockDai.getAddress(), ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress);
        
        // ** FIX: Pre-fund user1 with all DAI needed for the test BEFORE transferring ownership **
        await mockDai.mint(user1.address, ethers.parseEther("500")); 
        
        await mockDai.transferOwnership(await faucet.getAddress());
    });

    it("Should successfully run all protocol function tests", async function() {
        // --- Treasury Buy Test ---
        const purchaseAmountDai = ethers.parseUnits("100", 18);
        await mockDai.connect(user1).approve(await treasury.getAddress(), purchaseAmountDai);
        const userLmktBalance_beforeBuy = await lmkt.balanceOf(user1.address);
        await treasury.connect(user1).buyMkt(purchaseAmountDai, await mockDai.getAddress());
        const userLmktBalance_afterBuy = await lmkt.balanceOf(user1.address);
        expect(userLmktBalance_afterBuy).to.be.gt(userLmktBalance_beforeBuy);
        
        // --- Treasury Sell & Burn Test ---
        const initialTotalSupply = await lmkt.totalSupply();
        const sellAmountLmkt = await lmkt.balanceOf(user1.address);
        await lmkt.connect(user1).approve(await treasury.getAddress(), sellAmountLmkt);
        await treasury.connect(user1).sellMkt(sellAmountLmkt, await mockDai.getAddress());
        const finalTotalSupply = await lmkt.totalSupply();
        const expectedBurnAmount = (sellAmountLmkt * 5n) / 10000n;
        expect(initialTotalSupply - finalTotalSupply).to.equal(expectedBurnAmount);

        // --- PaymentProcessor Test ---
        const price = ethers.parseUnits("1000", 18);
        const fee = (price * 50n) / 10000n;
        const totalAmount = price + fee;
        const listingId = 1;

        // Fund user1 with enough LMKT for the purchase by buying from the treasury again
        const daiForPurchase = ethers.parseUnits("15", 18);
        await mockDai.connect(user1).approve(await treasury.getAddress(), daiForPurchase);
        await treasury.connect(user1).buyMkt(daiForPurchase, await mockDai.getAddress());

        // Approve and make purchase
        const userLmktBalanceForPurchase = await lmkt.balanceOf(user1.address);
        await lmkt.connect(user1).approve(await paymentProcessor.getAddress(), userLmktBalanceForPurchase);
        await paymentProcessor.connect(user1).makePurchase(listingId, price);
        
        expect(await lmkt.balanceOf(await paymentProcessor.getAddress())).to.equal(totalAmount);
        
        const initialSellerBalance = await lmkt.balanceOf(seller.address);
        const initialTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());
        
        // Release funds
        await paymentProcessor.connect(user1).releaseFunds(listingId);
        
        const treasuryShare = fee / 2n;
        const sellerAmount = price + (fee - treasuryShare);
        
        expect(await lmkt.balanceOf(seller.address)).to.equal(initialSellerBalance + sellerAmount);
        expect(await lmkt.balanceOf(await treasury.getAddress())).to.equal(initialTreasuryBalance + treasuryShare);
    });
});
