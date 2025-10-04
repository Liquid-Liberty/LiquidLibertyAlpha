import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ListingManager", function () {
    let listingManager, treasury, mockDai, mockOracle, paymentProcessor;
    let owner, user, user2, trustedSigner, paymentProcessorSigner;

    async function createEIP712Signature(signer, userAddress, dataIdentifier, nonce, deadline) {
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await listingManager.getAddress()
        };
        const types = { CreateListing: [ { name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' } ] };
        const value = { user: userAddress, dataIdentifier: dataIdentifier, nonce: nonce, deadline: deadline };
        return signer.signTypedData(domain, types, value);
    }

    beforeEach(async function () {
        [owner, user, user2, trustedSigner] = await ethers.getSigners();

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
        await mockDai.mint(user2.address, ethers.parseEther("1000"));
        await listingManager.connect(owner).setPaymentProcessor(await paymentProcessor.getAddress());
        
        await hardhat.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [await paymentProcessor.getAddress()],
        });
        paymentProcessorSigner = await ethers.getSigner(await paymentProcessor.getAddress());
        await hardhat.network.provider.send("hardhat_setBalance", [
            paymentProcessorSigner.address,
            "0xDE0B6B3A7640000",
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
            const signature = await createEIP712Signature(trustedSigner, user.address, DATA_IDENTIFIER, nonce, deadline);
            const expectedFee = ethers.parseEther("5");
            await mockDai.connect(user).approve(await listingManager.getAddress(), expectedFee);
            
            await listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            );

            const listing = await listingManager.listings(1);
            expect(listing.owner).to.equal(user.address);
        });
    });
    
    describe("Listing Management", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 3600;
            const nonce = 1;
            const signature = await createEIP712Signature(trustedSigner, user.address, "ipfs://todelete", nonce, deadline);
            const fee = ethers.parseEther("5");
            await mockDai.connect(user).approve(await listingManager.getAddress(), fee);
            await listingManager.connect(user).createListing(0, 100 * 10**8, "ipfs://todelete", nonce, deadline, signature);
        });

        it("Should allow the owner to delete their listing", async function () {
            await expect(listingManager.connect(user).deleteListing(1))
                .to.emit(listingManager, "ListingDeleted").withArgs(1);
            const listing = await listingManager.listings(1);
            expect(listing.owner).to.equal(ethers.ZeroAddress);
        });

        it("Should prevent another user from deleting a listing", async function () {
            await expect(listingManager.connect(owner).deleteListing(1))
                .to.be.revertedWith("ListingManager: Not your listing");
        });
    });

    describe("Listing Renewal & Expiration", function() {
        beforeEach(async function() {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(trustedSigner, user.address, "ipfs://data", 1, deadline);
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
            await listingManager.connect(user).renewListing(1);
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
            const signature = await createEIP712Signature(trustedSigner, user.address, "ipfs://data", 1, deadline);
            await mockDai.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("5"));
            await listingManager.connect(user).createListing(0, 100 * 10**8, "ipfs://data", 1, deadline, signature);

            await expect(listingManager.connect(user).closeListing(1))
                .to.be.revertedWith("LM: Caller is not the PaymentProcessor");
        });
    });

    // --- Admin Functions Suite (Restored) ---
    describe("Admin Functions", function () {
        it("Should allow the owner to set a new trusted signer", async function () {
            await listingManager.connect(owner).setTrustedSigner(user.address);
            expect(await listingManager.trustedSigner()).to.equal(user.address);
        });

        it("Should prevent non-owners from setting a new trusted signer", async function () {
            await expect(listingManager.connect(user).setTrustedSigner(user.address))
                .to.be.revertedWithCustomError(listingManager, "OwnableUnauthorizedAccount");
        });

        it("Should allow the owner to set new fees", async function () {
            const newSaleFee = 7 * 10**8;
            const newServiceFee = 25 * 10**8;
            await listingManager.connect(owner).setFees(newSaleFee, newServiceFee);
            expect(await listingManager.forSaleFee()).to.equal(newSaleFee);
            expect(await listingManager.serviceFee()).to.equal(newServiceFee);
        });

        it("Should prevent non-owners from setting new fees", async function () {
            await expect(listingManager.connect(user).setFees(0, 0))
                .to.be.revertedWithCustomError(listingManager, "OwnableUnauthorizedAccount");
        });

        it("Should allow the owner to set a new Payment Processor", async function() {
            await listingManager.connect(owner).setPaymentProcessor(user.address);
            expect(await listingManager.paymentProcessor()).to.equal(user.address);
        });
    });

    // --- New `getListingsByOwner` Suite ---
    describe("Get Listings by Owner", function() {
        it("Should return correct listing IDs for each owner and update after deletion", async function() {
            await mockDai.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("10"));
            await mockDai.connect(user2).approve(await listingManager.getAddress(), ethers.parseEther("5"));

            let deadline = (await time.latest()) + 3600;
            let sig = await createEIP712Signature(trustedSigner, user.address, "user-item-1", 1, deadline);
            await listingManager.connect(user).createListing(0, 100, "user-item-1", 1, deadline, sig);

            deadline = (await time.latest()) + 3600;
            sig = await createEIP712Signature(trustedSigner, user2.address, "user2-item-1", 2, deadline);
            await listingManager.connect(user2).createListing(0, 200, "user2-item-1", 2, deadline, sig);

            deadline = (await time.latest()) + 3600;
            sig = await createEIP712Signature(trustedSigner, user.address, "user-item-2", 3, deadline);
            await listingManager.connect(user).createListing(0, 300, "user-item-2", 3, deadline, sig);

            let user1Listings = await listingManager.getListingsByOwner(user.address);
            expect(user1Listings.map(id => Number(id))).to.deep.equal([1, 3]);

            let user2Listings = await listingManager.getListingsByOwner(user2.address);
            expect(user2Listings.map(id => Number(id))).to.deep.equal([2]);

            await listingManager.connect(user).deleteListing(1);
            user1Listings = await listingManager.getListingsByOwner(user.address);
            expect(user1Listings.map(id => Number(id))).to.deep.equal([3]);
        });
    });

    // --- New `getActiveListings` Suite ---
    describe("Get Active Listings (Pagination)", function() {
        beforeEach(async function() {
            await mockDai.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("100"));
            for (let i = 1; i <= 5; i++) {
                const deadline = (await time.latest()) + 3600;
                const sig = await createEIP712Signature(trustedSigner, user.address, `item-${i}`, i, deadline);
                await listingManager.connect(user).createListing(0, 100 * i, `item-${i}`, i, deadline, sig);
            }
            let deadline = (await time.latest()) + 3600;
            let sig = await createEIP712Signature(trustedSigner, user.address, "item-6", 6, deadline);
            await listingManager.connect(user).createListing(0, 600, "item-6", 6, deadline, sig);
            await listingManager.connect(user).deleteListing(6);
        });

        it("Should fetch the first page of active listings", async function() {
            const [listingIds, nextCursor] = await listingManager.getActiveListings(0, 3);
            expect(listingIds.map(id => Number(id))).to.deep.equal([5, 4, 3]);
            expect(nextCursor).to.equal(2);
        });

        it("Should fetch the second page using the cursor", async function() {
            const [, firstCursor] = await listingManager.getActiveListings(0, 3);
            const [listingIds, nextCursor] = await listingManager.getActiveListings(firstCursor, 3);
            expect(listingIds.map(id => Number(id))).to.deep.equal([2, 1]);
            expect(nextCursor).to.equal(0);
        });
    });
});