import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PaymentProcessor", function () {
    let paymentProcessor, listingManager, treasury, lmkt, mockDai, mockOracle;
    let owner, buyer, seller, trustedSigner;

    const LISTING_ID_SALE = 1;
    const LISTING_ID_SERVICE = 2;
    const LISTING_PRICE_USD = 2000 * 10**8;

    beforeEach(async function () {
        [owner, buyer, seller, trustedSigner] = await ethers.getSigners();

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
            await treasury.getAddress(), await mockDai.getAddress(), trustedSigner.address
        );
        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(
            await treasury.getAddress(), await listingManager.getAddress(), await lmkt.getAddress()
        );

        await treasury.setLmktAddress(await lmkt.getAddress());
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);
        await mockOracle.setPrice(daiQueryId, 1 * 10**8);
        await mockDai.mint(await treasury.getAddress(), ethers.parseEther("1000000"));
        await lmkt.transferOwnership(await treasury.getAddress());
        await listingManager.setPaymentProcessor(await paymentProcessor.getAddress());

        const createSignature = async (listingNonce, listingType) => {
            const deadline = (await time.latest()) + 3600;
            const dataIdentifier = `ipfs://item-${listingNonce}`;
            const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await listingManager.getAddress() };
            const types = { CreateListing: [{ name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
            const value = { user: seller.address, dataIdentifier, nonce: listingNonce, deadline };
            const signature = await trustedSigner.signTypedData(domain, types, value);
            
            const fee = listingType === 0 ? ethers.parseEther("5") : ethers.parseEther("20");
            await mockDai.connect(seller).approve(await listingManager.getAddress(), fee);
            await listingManager.connect(seller).createListing(listingType, LISTING_PRICE_USD, dataIdentifier, listingNonce, deadline, signature);
        };
        
        await mockDai.mint(seller.address, ethers.parseEther("25"));
        await createSignature(LISTING_ID_SALE, 0);
        await createSignature(LISTING_ID_SERVICE, 1);

        await mockDai.mint(buyer.address, ethers.parseEther("5000"));
        await mockDai.connect(buyer).approve(await treasury.getAddress(), ethers.parseEther("5000"));
        await treasury.connect(buyer).buyMkt(ethers.parseEther("5000"), await mockDai.getAddress(), 0);
    });

    describe("Execute Payment", function () {
        it("Should transfer the correct LMKT amounts and close a 'For Sale' listing", async function () {
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const itemPriceInLmkt = (BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd;
            const totalFeeInLmkt = (itemPriceInLmkt * 50n) / 10000n;
            const treasuryShare = totalFeeInLmkt / 2n;
            const sellerBonus = totalFeeInLmkt - treasuryShare;
            const expectedSellerAmount = itemPriceInLmkt + sellerBonus;
            const totalAmount = itemPriceInLmkt + totalFeeInLmkt;
            
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);

            const initialSellerBalance = await lmkt.balanceOf(seller.address);
            const initialTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());

            await paymentProcessor.connect(buyer).executePayment(LISTING_ID_SALE, totalAmount);
            
            const finalSellerBalance = await lmkt.balanceOf(seller.address);
            const finalTreasuryBalance = await lmkt.balanceOf(await treasury.getAddress());
            
            expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(treasuryShare);

            const listing = await listingManager.getListing(LISTING_ID_SALE);
            expect(listing.status).to.equal(1);
        });

        it("Should leave a 'ServiceOffered' listing active after purchase", async function() {
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const itemPriceInLmkt = (BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd;
            const totalAmount = itemPriceInLmkt * 1005n / 1000n;
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);

            await paymentProcessor.connect(buyer).executePayment(LISTING_ID_SERVICE, totalAmount);
            
            const listing = await listingManager.getListing(LISTING_ID_SERVICE);
            expect(listing.status).to.equal(0);
        });

        it("Should emit a PurchaseMade event with correct arguments", async function () {
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const itemPriceInLmkt = (BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd;
            const totalAmount = itemPriceInLmkt * 1005n / 1000n;
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);

            await expect(paymentProcessor.connect(buyer).executePayment(LISTING_ID_SALE, totalAmount))
                .to.emit(paymentProcessor, "PurchaseMade")
                .withArgs(LISTING_ID_SALE, buyer.address, seller.address, totalAmount);
        });
    });

    describe("Security and Error Handling", function () {
        it("Should revert if slippage tolerance is exceeded", async function() {
            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const itemPriceInLmkt = (BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd;
            const totalAmount = itemPriceInLmkt * 1005n / 1000n;
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);
            
            const maxLmktToPay = totalAmount - 1n;

            await expect(paymentProcessor.connect(buyer).executePayment(LISTING_ID_SALE, maxLmktToPay))
                .to.be.revertedWith("PaymentProcessor: Slippage tolerance exceeded");
        });

        it("Should revert if the listing is expired", async function() {
            await time.increase(31 * 24 * 60 * 60);

            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const totalAmount = ((BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd) * 1005n / 1000n;
            await lmkt.connect(buyer).approve(await paymentProcessor.getAddress(), totalAmount);

            await expect(paymentProcessor.connect(buyer).executePayment(LISTING_ID_SALE, totalAmount))
                .to.be.revertedWith("PaymentProcessor: Listing has expired");
        });

        it("Should prevent the seller from buying their own listing", async function () {
            const daiForSeller = ethers.parseEther("5000");
            await mockDai.mint(seller.address, daiForSeller);
            await mockDai.connect(seller).approve(await treasury.getAddress(), daiForSeller);
            await treasury.connect(seller).buyMkt(daiForSeller, await mockDai.getAddress(), 0);

            const lmktPriceUsd = await treasury.getLmktPriceInUsd();
            const totalAmount = ((BigInt(LISTING_PRICE_USD) * (10n ** 18n)) / lmktPriceUsd) * 1005n / 1000n;
            await lmkt.connect(seller).approve(await paymentProcessor.getAddress(), totalAmount);
            
            await expect(paymentProcessor.connect(seller).executePayment(LISTING_ID_SALE, totalAmount))
                .to.be.revertedWith("PaymentProcessor: Cannot buy your own listing");
        });
    });
});