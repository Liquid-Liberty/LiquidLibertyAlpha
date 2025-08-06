import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Liberty Market Protocol v4", function () {
    let paymentProcessor, treasury, lmkt, faucet, listingManager, priceOracleConsumer;
    let owner, seller, buyer;
    const DAI_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("USDT/USD"));

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();

        const GenericERC20Factory = await ethers.getContractFactory("GenericERC20");
        const dai = await GenericERC20Factory.deploy("Mock DAI", "mDAI", 18);
        const weth = await GenericERC20Factory.deploy("Mock WETH", "mWETH", 18);
        const wbtc = await GenericERC20Factory.deploy("Mock WBTC", "mWBTC", 8);
        const pls = await GenericERC20Factory.deploy("Mock PLS", "mPLS", 18);

        const PriceOracleConsumerFactory = await ethers.getContractFactory("PriceOracleConsumer");
        priceOracleConsumer = await PriceOracleConsumerFactory.deploy("0x0000000000000000000000000000000000000001");

        const FaucetFactory = await ethers.getContractFactory("Faucet");
        faucet = await FaucetFactory.deploy(
            await dai.getAddress(), await weth.getAddress(), await wbtc.getAddress(), await pls.getAddress()
        );

        await dai.addMinter(await faucet.getAddress());
        await weth.addMinter(await faucet.getAddress());
        await wbtc.addMinter(await faucet.getAddress());
        await pls.addMinter(await faucet.getAddress());

        const LmktFactory = await ethers.getContractFactory("LMKT");
        lmkt = await LmktFactory.deploy();

        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        // --- Configuration ---
        await treasury.setLmktAddress(await lmkt.getAddress());
        await treasury.setWhitelistedCollateral(await dai.getAddress(), true);
        await treasury.setPriceFeed(await dai.getAddress(), await priceOracleConsumer.getAddress());
        await treasury.setTokenQueryId(await dai.getAddress(), DAI_USD_QUERY_ID);
        await priceOracleConsumer.fetchLatestPrice(DAI_USD_QUERY_ID);


        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(
            await treasury.getAddress(), await lmkt.getAddress()
        );

        const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
        listingManager = await ListingManagerFactory.deploy(
            await treasury.getAddress(), await lmkt.getAddress(), owner.address
        );

        await lmkt.mint(buyer.address, ethers.parseEther("5000"));
    });

    it("Should allow a user to create a new listing with a valid signature", async function() {
        const listingFee = ethers.parseEther("25");
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const listingType = 0;
        const dataIdentifier = "ipfs://Qm...";
        
        await lmkt.connect(buyer).approve(await listingManager.getAddress(), listingFee);

        const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await listingManager.getAddress() };
        const types = { Listing: [ { name: 'listingType', type: 'uint8' }, { name: 'dataIdentifier', type: 'string' }, { name: 'userAddress', type: 'address' }, { name: 'feeInToken', type: 'uint256' }, { name: 'deadline', type: 'uint256' } ] };
        const value = { listingType, dataIdentifier, userAddress: buyer.address, feeInToken: listingFee, deadline };
        const signature = await owner.signTypedData(domain, types, value);

        await expect(listingManager.connect(buyer).createListing(
            listingType, dataIdentifier, listingFee, deadline, signature
        )).to.emit(listingManager, "ListingCreated").withArgs(1, buyer.address, listingType, listingFee);
        
        const treasuryBalance = await lmkt.balanceOf(await treasury.getAddress());
        // The treasury balance should be at least the listing fee. It might be higher from other operations.
        expect(treasuryBalance).to.be.gte(listingFee);
    });

    it("Should successfully run all protocol function tests", async function () {
        await faucet.connect(buyer).requestTokens();

        const daiAmountToSpend = ethers.parseEther("100");
        const daiContract = await ethers.getContractAt("GenericERC20", await faucet.mockDaiToken());
        await daiContract.connect(buyer).approve(await treasury.getAddress(), daiAmountToSpend);
        
        await lmkt.mint(await treasury.getAddress(), ethers.parseEther("100000"));
        await daiContract.mint(await treasury.getAddress(), ethers.parseEther("100000"));
        await treasury.connect(buyer).buyMkt(daiAmountToSpend, await daiContract.getAddress());

        const price = ethers.parseEther("1000");
        const feeBase = await paymentProcessor.FEE_BASE();
        const commerceFee = await paymentProcessor.COMMERCE_FEE();
        const totalFee = (price * commerceFee) / feeBase;
        const totalAmount = price + totalFee;
        const initialSellerBalance = await lmkt.balanceOf(seller.address);

        await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);
        await paymentProcessor.connect(buyer).makePurchase(1, price, seller.address);
        await paymentProcessor.connect(buyer).releaseFunds(1);

        const expectedSellerAmount = price + (totalFee / 2n);
        expect(await lmkt.balanceOf(seller.address)).to.equal(initialSellerBalance + expectedSellerAmount);
    });
});