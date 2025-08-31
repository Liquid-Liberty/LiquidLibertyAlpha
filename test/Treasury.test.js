import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Treasury", function () {
    let treasury, lmkt, mockDai, mockOracle;
    let owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // 1. Deploy contracts
        const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        mockOracle = await MockOracleFactory.deploy();

        const LmktFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LmktFactory.deploy();

        const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);

        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        // 2. Configure the system
        await treasury.setLmktAddress(await lmkt.getAddress());
        await lmkt.transferOwnership(await treasury.getAddress());

        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);
        
        await mockOracle.setPrice(daiQueryId, 1 * 10**8);

        // 3. Fund accounts
        const initialLmktSupply = await lmkt.balanceOf(owner.address);
        await lmkt.connect(owner).transfer(await treasury.getAddress(), initialLmktSupply);

        await mockDai.mint(user.address, ethers.parseEther("10000"));
    });

    describe("Deployment & Configuration", function () {
        it("Should allow the owner to set fee rates", async function () {
            await treasury.setFeeRate(150, 150, 50);
            expect(await treasury.SELL_PREMIUM()).to.equal(150);
        });
    });

    describe("buyMkt", function () {
        it("Should allow a user to buy LMKT with collateral", async function () {
            const collateralAmount = ethers.parseEther("1000");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralAmount);
            await mockDai.mint(await treasury.getAddress(), ethers.parseEther("1000"));
            
            // CORRECTED LOGIC: Calculate expected output based on the FUTURE state
            const collateralValue = await treasury.getCollateralTokenValue(collateralAmount, await mockDai.getAddress());
            const totalCollateralBefore = await treasury.getTotalCollateralValue();
            const circulatingSupply = await lmkt.totalSupply();
            const totalCollateralAfter = totalCollateralBefore + collateralValue;
            
            const baseLmktAmount = (collateralValue * circulatingSupply) / totalCollateralAfter;
            const buyDiscount = await treasury.BUY_DISCOUNT();
            const expectedLmktOut = (baseLmktAmount * (10000n - buyDiscount)) / 10000n;

            const initialUserLmkt = await lmkt.balanceOf(user.address);
            await treasury.connect(user).buyMkt(collateralAmount, await mockDai.getAddress(), 0);

            expect(await lmkt.balanceOf(user.address)).to.equal(initialUserLmkt + expectedLmktOut);
        });
    });

    describe("sellMkt", function () {
        beforeEach(async function() {
            const collateralAmount = ethers.parseEther("1000");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralAmount);
            await mockDai.mint(await treasury.getAddress(), ethers.parseEther("1000"));
            await treasury.connect(user).buyMkt(collateralAmount, await mockDai.getAddress(), 0);
        });

        it("Should allow a user to sell LMKT for collateral and burn a portion", async function () {
            const lmktToSell = await lmkt.balanceOf(user.address);
            await lmkt.connect(user).approve(await treasury.getAddress(), lmktToSell);

            // CORRECTED LOGIC: Calculate based on post-burn state
            const burnRate = await treasury.BURN_RATE();
            const expectedBurnAmount = (lmktToSell * burnRate) / 10000n;
            const remainingLmkt = lmktToSell - expectedBurnAmount;
            
            const totalCollateral = await treasury.getTotalCollateralValue();
            const totalSupplyBefore = await lmkt.totalSupply();
            const totalSupplyAfterBurn = totalSupplyBefore - expectedBurnAmount;

            const baseCollateralValue = (remainingLmkt * totalCollateral) / totalSupplyAfterBurn;
            const sellPremium = await treasury.SELL_PREMIUM();
            const expectedDaiOut = (baseCollateralValue * (10000n - sellPremium)) / 10000n;
            
            const initialUserDai = await mockDai.balanceOf(user.address);
            await treasury.connect(user).sellMkt(lmktToSell, await mockDai.getAddress(), 0);

            expect(await mockDai.balanceOf(user.address)).to.equal(initialUserDai + expectedDaiOut);
        });
    });

    describe("View Functions", function () {
        it("getLmktPriceInUsd should return a valid price based on collateral", async function() {
            await mockDai.mint(await treasury.getAddress(), ethers.parseEther("1000000"));
            const expectedPrice = 40000000;
            expect(await treasury.getLmktPriceInUsd()).to.equal(expectedPrice);
        });
    });

    describe("Security and Access Control", function () {
        it("Should prevent a random user from burning LMKT directly", async function () {
            const amountToBurn = ethers.parseEther("100");
            await expect(lmkt.connect(user).burn(amountToBurn))
                .to.be.revertedWithCustomError(lmkt, "OwnableUnauthorizedAccount")
                .withArgs(user.address);
        });
    });
});