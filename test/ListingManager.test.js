import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ListingManager (EIP-712)", function () {
    let listingManager, treasury, lmkt;
    let owner, user, trustedSigner;

    // --- NEW: EIP-712 Signature Helper ---
    // This function replaces the old one. It constructs the EIP-712 typed data
    // and uses signTypedData to create a valid signature.
    async function createEIP712Signature(listingType, dataIdentifier, userAddress, fee, deadline) {
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await listingManager.getAddress()
        };

        const types = {
            Listing: [
                { name: 'listingType', type: 'uint256' },
                { name: 'dataIdentifier', type: 'string' },
                { name: 'userAddress', type: 'address' },
                { name: 'feeInToken', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };

        const value = {
            listingType: listingType,
            dataIdentifier: dataIdentifier,
            userAddress: userAddress,
            feeInToken: fee,
            deadline: deadline,
        };

        // The trustedSigner (defined in beforeEach) signs the data
        return trustedSigner.signTypedData(domain, types, value);
    }

    beforeEach(async function () {
        [owner, user, trustedSigner] = await ethers.getSigners();

        const LmktFactory = await ethers.getContractFactory("GenericERC20");
        lmkt = await LmktFactory.deploy("Liberty Market Token", "LMKT", 18);

        const TreasuryFactory = await ethers.getContractFactory("Treasury");
        treasury = await TreasuryFactory.deploy();

        const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
        listingManager = await ListingManagerFactory.deploy(
            await treasury.getAddress(),
            await lmkt.getAddress(),
            trustedSigner.address
        );

        await lmkt.mint(user.address, ethers.parseEther("1000"));
    });

    describe("Deployment", function () {
        // No changes needed here, these tests are still correct.
        it("Should set the correct initial addresses", async function () {
            expect(await listingManager.treasury()).to.equal(await treasury.getAddress());
            expect(await listingManager.paymentToken()).to.equal(await lmkt.getAddress());
            expect(await listingManager.trustedSigner()).to.equal(trustedSigner.address);
        });
    });

    describe("Listing Creation with Signature", function () {
        const LISTING_TYPE_FOR_SALE = 0;
        const DATA_IDENTIFIER = "ipfs://forsale";
        const FEE_IN_TOKEN = ethers.parseEther("50");

        it("Should create a listing with a valid EIP-712 signature", async function () {
            const deadline = (await time.latest()) + 3600;
            // We no longer need a nonce. We use the new helper function.
            const signature = await createEIP712Signature(LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, user.address, FEE_IN_TOKEN, deadline);

            await lmkt.connect(user).approve(await listingManager.getAddress(), FEE_IN_TOKEN);

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, FEE_IN_TOKEN, deadline, signature
            )).to.emit(listingManager, "ListingCreated").withArgs(1, user.address, LISTING_TYPE_FOR_SALE, FEE_IN_TOKEN);

            const listing = await listingManager.listings(1);
            expect(listing.owner).to.equal(user.address);

            // Verify that the hash of the signature has been marked as used
            const messageHash = await listingManager.getListingMessageHash(LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, user.address, FEE_IN_TOKEN, deadline);
            expect(await listingManager.usedHashes(messageHash)).to.be.true;
        });

        it("Should fail with an invalid signature from an untrusted signer", async function () {
            const deadline = (await time.latest()) + 3600;
            // Create the same EIP-712 data...
            const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await listingManager.getAddress() };
            const types = { Listing: [ { name: 'listingType', type: 'uint256' }, { name: 'dataIdentifier', type: 'string' }, { name: 'userAddress', type: 'address' }, { name: 'feeInToken', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, ], };
            const value = { listingType: LISTING_TYPE_FOR_SALE, dataIdentifier: DATA_IDENTIFIER, userAddress: user.address, feeInToken: FEE_IN_TOKEN, deadline: deadline };
            
            // ...but have it signed by the wrong account ('owner' instead of 'trustedSigner').
            const invalidSignature = await owner.signTypedData(domain, types, value);

            await lmkt.connect(user).approve(await listingManager.getAddress(), FEE_IN_TOKEN);

            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, FEE_IN_TOKEN, deadline, invalidSignature
            )).to.be.revertedWith("ListingManager: Invalid signature");
        });

        it("Should fail if the deadline has passed", async function () {
            const deadline = (await time.latest()) - 1; // 1 second in the past
            // Use the new helper to create the signature
            const signature = await createEIP712Signature(LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, user.address, FEE_IN_TOKEN, deadline);

            await lmkt.connect(user).approve(await listingManager.getAddress(), FEE_IN_TOKEN);

            // The revert message for an expired deadline is still correct.
            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, FEE_IN_TOKEN, deadline, signature
            )).to.be.revertedWith("ListingManager: Signature expired");
        });

        it("Should fail if a signature is replayed", async function () {
            const deadline = (await time.latest()) + 3600;
            const signature = await createEIP712Signature(LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, user.address, FEE_IN_TOKEN, deadline);

            await lmkt.connect(user).approve(await listingManager.getAddress(), ethers.parseEther("100")); // Approve enough for two

            // First call should succeed
            await listingManager.connect(user).createListing(LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, FEE_IN_TOKEN, deadline, signature);

            // Second call with the same signature should fail because the hash is now in usedHashes.
            await expect(listingManager.connect(user).createListing(
                LISTING_TYPE_FOR_SALE, DATA_IDENTIFIER, FEE_IN_TOKEN, deadline, signature
            )).to.be.revertedWith("ListingManager: Signature already used"); // Updated revert message
        });
    });

    describe("Listing Management", function () {
        // The beforeEach hook here needs to use the new signature helper
        beforeEach(async function () {
            const deadline = (await time.latest()) + 3600;
            const fee = ethers.parseEther("50");
            const signature = await createEIP712Signature(0, "ipfs://todelete", user.address, fee, deadline);

            await lmkt.connect(user).approve(await listingManager.getAddress(), fee);
            await listingManager.connect(user).createListing(0, "ipfs://todelete", fee, deadline, signature);
        });

        // No changes needed for the tests below, they are unaffected by the signature logic.
        it("Should allow the owner to delete their listing", async function () {
            await expect(listingManager.connect(user).deleteListing(1)).to.emit(listingManager, "ListingDeleted").withArgs(1);
            const listing = await listingManager.listings(1);
            expect(listing.owner).to.equal(ethers.ZeroAddress);
        });

        it("Should prevent another user from deleting a listing", async function () {
            await expect(listingManager.connect(owner).deleteListing(1)).to.be.revertedWith("ListingManager: Not your listing");
        });
    });
});