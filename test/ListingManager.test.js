
import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ListingManager", function () {
    let listingManager, treasury, mockDai, mockOracle, paymentProcessor;
    let owner, user, trustedSigner, paymentProcessorSigner;

    async function createEIP712Signature(userAddress, dataIdentifier, nonce, deadline) {
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await listingManager.getAddress()
        };
        const types = { CreateListing: [ { name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' } ] };
        const value = { user: userAddress, dataIdentifier: dataIdentifier, nonce: nonce, deadline: deadline };
        return trustedSigner.signTypedData(domain, types, value);
    }

    beforeEach(async function () {
        [owner, user, trustedSigner] = await ethers.getSigners();

        const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        mockOracle = await MockOracleFactory.deploy();
        const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);
        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();
        const LmktFactory = await ethers.getContractFactory("LMKT");
        const lmkt = await LmktFactory.deploy();

        const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
        listingManager = await ListingManagerFactory.deploy(
            await treasury.getAddress(), await mockDai.getAddress(), trustedSigner.address
        );

        const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = await PaymentProcessorFactory.deploy(
            await treasury.getAddress(), await listingManager.getAddress(), await lmkt.getAddress()
        );

        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);
        
        const oneDollar = 1 * 10**8;
        await mockOracle.setPrice(daiQueryId, oneDollar);
        await mockDai.mint(user.address, ethers.parseEther("1000"));

        await listingManager.connect(owner).setPaymentProcessor(await paymentProcessor.getAddress());
        
        await hardhat.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [await paymentProcessor.getAddress()],
        });
        paymentProcessorSigner = await ethers.getSigner(await paymentProcessor.getAddress());

        // --- CHANGE: This is the correct way to fund an impersonated account for gas fees ---
        await hardhat.network.provider.send("hardhat_setBalance", [
            paymentProcessorSigner.address,
            "0xDE0B6B3A7640000", // 1 ETH in hex
        ]);
    });

    describe("Listing Creation", function () {
        const LISTING_TYPE_FOR_SALE = 0;
        const LISTING_TYPE_SERVICE = 1;
        const DATA_IDENTIFIER = "ipfs://listing-data";
        const PRICE_IN_USD = 500 * 10**8;
        let nonce = 0;

        beforeEach(() => {
            nonce++;
        });

        it("Should create a 'For Sale' listing and charge the correct $5 fee", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);
            const expectedFee = ethers.parseEther("5");
            await mockDai.connect(user).approve(await listingManager.getAddress(), expectedFee);
            const initialTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            )).to.emit(listingManager, "ListingCreated");

            const finalTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(expectedFee);

            const listing = await listingManager.listings(1);
            expect(listing.owner).to.equal(user.address);
            expect(listing.priceInUsd).to.equal(PRICE_IN_USD);
            expect(listing.status).to.equal(0);
        });

        it("Should create a 'Service' listing and charge the correct $20 fee", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);
            const expectedFee = ethers.parseEther("20");
            await mockDai.connect(user).approve(await listingManager.getAddress(), expectedFee);
            const initialTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());

            await listingManager.connect(user).createListing(
                LISTING_TYPE_SERVICE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            );

            const finalTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(expectedFee);
        });

        it("Should fail with an invalid signature from an untrusted signer", async function () {
            const deadline = (await time.latest()) + 3600;
            const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await listingManager.getAddress() };
            const types = { CreateListing: [ { name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' } ] };
            const value = { user: user.address, dataIdentifier: DATA_IDENTIFIER, nonce: nonce, deadline: deadline };
            const invalidSignature = await owner.signTypedData(domain, types, value);

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, invalidSignature
            )).to.be.revertedWith("ListingManager: Invalid signature");
        });

        it("Should fail if a signature is replayed (used nonce)", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);
            const fee = ethers.parseEther("5");
            await mockDai.connect(user).approve(await listingManager.getAddress(), fee * 2n);

            await listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            );

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            )).to.be.revertedWith("ListingManager: Signature already used");
        });
    });

    describe("Listing Renewal & Expiration", function() {
        beforeEach(async function() {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, "ipfs://data", 1, deadline);
            await mockDai.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("10"));
            await listingManager.connect(user).createListing(0, 100 * 10**8, "ipfs://data", 1, deadline, signature);
        });

        it("Should set an expiration date 30 days in the future upon creation", async function () {
            const listing = await listingManager.listings(1);
            const expectedExpiration = (await time.latest()) + (30 * 24 * 60 * 60);
            expect(listing.expirationTimestamp).to.be.closeTo(expectedExpiration, 2);
        });

        it("Should allow the owner to renew an active listing", async function() {
            await time.increase(15 * 24 * 60 * 60);
            const initialTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());
            await listingManager.connect(user).renewListing(1);
            const finalTreasuryBalance = await mockDai.balanceOf(await treasury.getAddress());
            expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(ethers.parseEther("5"));

            const listing = await listingManager.listings(1);
            const expectedExpiration = (await time.latest()) + (30 * 24 * 60 * 60);
            expect(listing.expirationTimestamp).to.be.closeTo(expectedExpiration, 2);
        });

        it("Should prevent renewing an inactive listing", async function() {
            await listingManager.connect(paymentProcessorSigner).closeListing(1);
            await expect(listingManager.connect(user).renewListing(1))
                .to.be.revertedWith("ListingManager: Listing not active");
        });
    });

    describe("Security", function() {
        it("Should prevent a random user from closing a listing", async function() {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, "ipfs://data", 1, deadline);
            await mockDai.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("5"));
            await listingManager.connect(user).createListing(0, 100 * 10**8, "ipfs://data", 1, deadline, signature);

            await expect(listingManager.connect(user).closeListing(1))
                .to.be.revertedWith("LM: Caller is not the PaymentProcessor");
        });
    });
});