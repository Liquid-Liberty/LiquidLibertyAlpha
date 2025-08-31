import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Treasury", function () {
    let treasury, lmkt, mockDai, mockOracle;
    let owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        mockOracle = await MockOracleFactory.deploy();
        const LmktFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LmktFactory.deploy();
        const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);
        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        await treasury.setLmktAddress(await lmkt.getAddress());
        
        const initialLmktSupply = await lmkt.totalSupply();
        await lmkt.transfer(await treasury.getAddress(), initialLmktSupply); 
        await lmkt.transferOwnership(await treasury.getAddress());

        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);
        await mockOracle.setPrice(daiQueryId, 1 * 10**8);

        await mockDai.mint(await treasury.getAddress(), ethers.parseEther("25000"));
        await mockDai.mint(user.address, ethers.parseEther("10000"));
    });

    describe("Admin & Configuration", function() {
        it("Should allow the owner to set new fee rates", async function() {
            await treasury.connect(owner).setFeeRate(150, 150);
            expect(await treasury.SELL_PREMIUM()).to.equal(150);
            expect(await treasury.BUY_DISCOUNT()).to.equal(150);
        });

        it("Should prevent non-owners from setting fee rates", async function() {
            await expect(treasury.connect(user).setFeeRate(150, 150))
                .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
        });
        
        it("Should allow depositing commerce fees", async function() {
            const feeAmount = ethers.parseEther("10");
            await mockDai.connect(user).approve(await treasury.getAddress(), feeAmount);
            
            const initialTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());
            await expect(treasury.connect(user).depositCommerceFee(await mockDai.getAddress(), feeAmount))
                .to.emit(treasury, "CommerceFeeReceived");

            expect(await mockDai.balanceOf(await treasury.getAddress())).to.equal(initialTreasuryBalance + feeAmount);
        });
    });

    describe("buyMkt", function () {
        it("Should mint new LMKT to a user in exchange for collateral", async function () {
            const collateralAmount = ethers.parseEther("1000");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralAmount);

            const initialTotalSupply = await lmkt.totalSupply();
            const expectedLmktToMint = await treasury.getLmktAmountForCollateral(collateralAmount, await mockDai.getAddress());
            
            await treasury.connect(user).buyMkt(collateralAmount, await mockDai.getAddress(), 0);

            const finalTotalSupply = await lmkt.totalSupply();
            expect(finalTotalSupply).to.equal(initialTotalSupply + expectedLmktToMint);
        });
    });

    describe("sellMkt", function () {
        beforeEach(async function() {
            const collateralAmount = ethers.parseEther("1000");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralAmount);
            await treasury.connect(user).buyMkt(collateralAmount, await mockDai.getAddress(), 0);
        });

        it("Should pay the user, burn 100% of tokens, and increase the LMKT price", async function () {
            const lmktToSell = await lmkt.balanceOf(user.address);
            expect(lmktToSell).to.be.gt(0);
            await lmkt.connect(user).approve(await treasury.getAddress(), lmktToSell);

            const initialPrice = await treasury.getLmktPriceInUsd();
            await treasury.connect(user).sellMkt(lmktToSell, await mockDai.getAddress(), 0);
            const finalPrice = await treasury.getLmktPriceInUsd();

            expect(finalPrice).to.be.above(initialPrice);
        });
    });

    describe("Security & Edge Cases", function() {
        it("Should revert buyMkt if minLmktOut is not met", async function() {
            const collateralAmount = ethers.parseEther("1000");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralAmount);
            const expectedLmktToMint = await treasury.getLmktAmountForCollateral(collateralAmount, await mockDai.getAddress());

            const minLmktOut = expectedLmktToMint + 1n;

            await expect(treasury.connect(user).buyMkt(collateralAmount, await mockDai.getAddress(), minLmktOut))
                .to.be.revertedWith("Treasury: Slippage tolerance exceeded");
        });

        it("Should revert sellMkt if minCollateralOut is not met", async function() {
            const collateralToBuy = ethers.parseEther("100");
            await mockDai.connect(user).approve(await treasury.getAddress(), collateralToBuy);
            await treasury.connect(user).buyMkt(collateralToBuy, await mockDai.getAddress(), 0);
            
            const lmktToSell = await lmkt.balanceOf(user.address);
            await lmkt.connect(user).approve(await treasury.getAddress(), lmktToSell);
            const expectedDaiOut = await treasury.getCollateralAmountForLmkt(lmktToSell, await mockDai.getAddress());

            const minCollateralOut = expectedDaiOut + 1n;

            await expect(treasury.connect(user).sellMkt(lmktToSell, await mockDai.getAddress(), minCollateralOut))
                .to.be.revertedWith("Treasury: Slippage tolerance exceeded");
        });

        it("Should prevent non-owners from calling admin functions", async function() {
            await expect(treasury.connect(user).setLmktAddress(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
            await expect(treasury.connect(user).setPriceFeed(ethers.ZeroAddress, ethers.ZeroAddress))
                .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
            await expect(treasury.connect(user).setWhitelistedCollateral(ethers.ZeroAddress, false))
                .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
        });
    });
});