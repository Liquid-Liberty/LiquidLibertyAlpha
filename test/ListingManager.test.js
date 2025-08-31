import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ListingManager", function () {
    let listingManager, treasury, mockDai, mockOracle;
    let owner, user, trustedSigner;

    // Helper to create the EIP-712 signature for creating a listing
    async function createEIP712Signature(userAddress, dataIdentifier, nonce, deadline) {
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await listingManager.getAddress()
        };

        const types = {
            CreateListing: [
                { name: 'user', type: 'address' },
                { name: 'dataIdentifier', type: 'string' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };

        const value = {
            user: userAddress,
            dataIdentifier: dataIdentifier,
            nonce: nonce,
            deadline: deadline,
        };

        return trustedSigner.signTypedData(domain, types, value);
    }

    beforeEach(async function () {
        [owner, user, trustedSigner] = await ethers.getSigners();

        // 1. Deploy Mock Oracle
        const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
        mockOracle = await MockOracleFactory.deploy();

        // 2. Deploy Mock DAI (our fee token)
        const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
        mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);

        // 3. Deploy Treasury
        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        // 4. Deploy ListingManager
        const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
        listingManager = await ListingManagerFactory.deploy(
            await treasury.getAddress(),
            await mockDai.getAddress(),
            trustedSigner.address
        );

        // --- Configure the System ---
        // a. Whitelist Mock DAI in Treasury and set its price feed
        await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
        await treasury.setPriceFeed(await mockDai.getAddress(), await mockOracle.getAddress());
        const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
        await treasury.setTokenQueryId(await mockDai.getAddress(), daiQueryId);

        // b. Set the price of Mock DAI to $1.00 in the oracle
        const oneDollar = 1 * 10**8; // Oracles use 8 decimals for USD
        await mockOracle.setPrice(daiQueryId, oneDollar);
        
        // c. Mint Mock DAI to the user for paying fees
        await mockDai.mint(user.address, ethers.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the correct initial addresses", async function () {
            expect(await listingManager.treasury()).to.equal(await treasury.getAddress());
            expect(await listingManager.feeToken()).to.equal(await mockDai.getAddress());
            expect(await listingManager.trustedSigner()).to.equal(trustedSigner.address);
        });
    });

    describe("Listing Creation", function () {
        const LISTING_TYPE_FOR_SALE = 0;
        const LISTING_TYPE_SERVICE = 1;
        const DATA_IDENTIFIER = "ipfs://listing-data";
        const PRICE_IN_USD = 500 * 10**8; // $500.00
        let nonce = 0;

        beforeEach(() => {
            nonce++; // Ensure a fresh nonce for each test
        });

        it("Should create a 'For Sale' listing and charge the correct $5 fee", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);
            
            const expectedFee = ethers.parseEther("5"); // $5 fee
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
            expect(listing.status).to.equal(0); // 0 = Active
        });

        it("Should create a 'Service' listing and charge the correct $20 fee", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);

            const expectedFee = ethers.parseEther("20"); // $20 fee
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

        it("Should fail if the deadline has passed", async function () {
            const deadline = (await time.latest()) - 1; // 1 second in the past
            const signature = await createEIP712Signature(user.address, DATA_IDENTIFIER, nonce, deadline);

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, PRICE_IN_USD, DATA_IDENTIFIER, nonce, deadline, signature
            )).to.be.revertedWith("ListingManager: Signature expired");
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

    describe("Listing Management", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 3600;
            const nonce = 1;
            const signature = await createEIP712Signature(user.address, "ipfs://todelete", nonce, deadline);
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
            const newSaleFee = 7 * 10**8; // $7
            const newServiceFee = 25 * 10**8; // $25
            await listingManager.connect(owner).setFees(newSaleFee, newServiceFee);
            expect(await listingManager.forSaleFee()).to.equal(newSaleFee);
            expect(await listingManager.serviceFee()).to.equal(newServiceFee);
        });

        it("Should prevent non-owners from setting new fees", async function () {
            await expect(listingManager.connect(user).setFees(0, 0))
                .to.be.revertedWithCustomError(listingManager, "OwnableUnauthorizedAccount");
        });
    });
});