import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Treasury", function () {
    let treasury, lmkt, dai, priceOracleConsumer;
    let owner, user1;
    const DAI_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("USDT/USD"));

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        const GenericERC20Factory = await ethers.getContractFactory("GenericERC20");
        dai = await GenericERC20Factory.deploy("Mock DAI", "mDAI", 18);
        
        const LmktFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LmktFactory.deploy();

        const PriceOracleConsumerFactory = await ethers.getContractFactory("PriceOracleConsumer");
        priceOracleConsumer = await PriceOracleConsumerFactory.deploy("0x0000000000000000000000000000000000000001");

        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        // --- Configuration ---
        await treasury.setLmktAddress(await lmkt.getAddress());
        await treasury.setWhitelistedCollateral(await dai.getAddress(), true);
        await treasury.setPriceFeed(await dai.getAddress(), await priceOracleConsumer.getAddress());
        await treasury.setTokenQueryId(await dai.getAddress(), DAI_USD_QUERY_ID);
        await priceOracleConsumer.fetchLatestPrice(DAI_USD_QUERY_ID);

        // --- Seeding ---
        await dai.mint(await treasury.getAddress(), ethers.parseEther("1000000"));
        await lmkt.connect(owner).mint(await treasury.getAddress(), ethers.parseEther("1000000"));
        await dai.mint(user1.address, ethers.parseEther("10000"));
        await lmkt.connect(owner).mint(user1.address, ethers.parseEther("10000"));
        
        await lmkt.transferOwnership(await treasury.getAddress());
    });

    describe("Core Functionality", function () {
        it("Should allow a user to buy LMKT with collateral", async function () {
            const daiAmountToSpend = ethers.parseEther("100");
            const initialUserDai = await dai.balanceOf(user1.address);
            const initialUserLmkt = await lmkt.balanceOf(user1.address);

            // User1 approves the Treasury to spend their DAI
            await dai.connect(user1).approve(await treasury.getAddress(), daiAmountToSpend);

            // User1 buys LMKT
            await treasury.connect(user1).buyMkt(daiAmountToSpend, await dai.getAddress());

            // Verify user's DAI balance decreased correctly
            expect(await dai.balanceOf(user1.address)).to.equal(initialUserDai - daiAmountToSpend);

            // Verify user's LMKT balance increased
            expect(await lmkt.balanceOf(user1.address)).to.be.above(initialUserLmkt);
        });

        it("Should allow a user to sell LMKT, which are then partially burned", async function () {
            const lmktToSell = ethers.parseEther("10000");
            const initialUserDai = await dai.balanceOf(user1.address);
            const initialUserLmkt = await lmkt.balanceOf(user1.address);

            // User1 approves the Treasury to spend their LMKT
            await lmkt.connect(user1).approve(await treasury.getAddress(), lmktToSell);

            // User1 sells LMKT
            await treasury.connect(user1).sellMkt(lmktToSell, await dai.getAddress());
            
            // Verify user's DAI balance has increased
            expect(await dai.balanceOf(user1.address)).to.be.above(initialUserDai);

            // Verify user's LMKT balance is now what they started with minus what they sold
            expect(await lmkt.balanceOf(user1.address)).to.equal(initialUserLmkt - lmktToSell);
        });
    });

    describe("Security", function () {
        it("Should prevent a random user from burning LMKT directly", async function () {
            const amountToBurn = ethers.parseEther("100");
            // Expect the transaction to be reverted with the OZ5 custom error
            await expect(lmkt.connect(user1).burn(amountToBurn))
                .to.be.revertedWithCustomError(lmkt, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
        });

        it("Should prevent a random user from minting new LMKT directly", async function () {
            const amountToMint = ethers.parseEther("100");
            // Expect the transaction to be reverted with the OZ5 custom error
            await expect(lmkt.connect(user1).mint(user1.address, amountToMint))
                .to.be.revertedWithCustomError(lmkt, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
        });
    });
});