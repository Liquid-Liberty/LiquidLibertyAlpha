import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import "dotenv/config";

// Helper function to log balances for clarity
async function logBalances(contracts, accounts) {
    const { mockDai, lmkt } = contracts;
    const { buyer, seller, treasury } = accounts;

    const buyerDai = ethers.formatEther(await mockDai.balanceOf(buyer.address));
    const sellerDai = ethers.formatEther(await mockDai.balanceOf(seller.address));
    const buyerLmkt = ethers.formatEther(await lmkt.balanceOf(buyer.address));
    const sellerLmkt = ethers.formatEther(await lmkt.balanceOf(seller.address));
    const treasuryLmkt = ethers.formatEther(await lmkt.balanceOf(treasury.target));
    
    console.log("--- Balances ---");
    console.log(`Buyer:    ${parseFloat(buyerDai).toFixed(2)} mDAI | ${parseFloat(buyerLmkt).toFixed(2)} LMKT`);
    console.log(`Seller:   ${parseFloat(sellerDai).toFixed(2)} mDAI | ${parseFloat(sellerLmkt).toFixed(2)} LMKT`);
    console.log(`Treasury:                | ${parseFloat(treasuryLmkt).toFixed(2)} LMKT`);
    console.log("----------------\n");
}


async function main() {
    console.log("🎬 Starting User Journey Simulation...\n");

    // --- 1. SETUP ---
    console.log("--- 1. Initializing environment and contracts ---");
    const [owner, seller, buyer] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync("./src/config/contract-addresses.json", "utf8"));
    const trustedSigner = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY);
    
    // Connect to deployed contracts
    const lmkt = await ethers.getContractAt("LMKT", addresses.LMKT);
    const mockDai = await ethers.getContractAt("GenericERC20", addresses.MockDai);
    const faucet = await ethers.getContractAt("Faucet", addresses.Faucet);
    const treasury = await ethers.getContractAt("Treasury", addresses.Treasury);
    const listingManager = await ethers.getContractAt("ListingManager", addresses.ListingManager);
    const paymentProcessor = await ethers.getContractAt("PaymentProcessor", addresses.PaymentProcessor);
    
    const contracts = { lmkt, mockDai, faucet, treasury, listingManager, paymentProcessor };
    const accounts = { buyer, seller, treasury };

    // Required configuration step for ListingManager security
    await listingManager.connect(owner).setPaymentProcessor(addresses.PaymentProcessor);
    
    console.log("Initial State:");
    await logBalances(contracts, accounts);

    // --- 2. USERS GET MOCK DAI ---
    console.log("--- 2. Buyer and Seller claim mDAI from Faucet ---");
    await faucet.connect(buyer).requestTokens();
    await faucet.connect(seller).requestTokens();
    console.log("Faucet claims successful.");
    await logBalances(contracts, accounts);

    // --- 3. SELLER CREATES LISTING ---
    console.log("--- 3. Seller creates a listing for $150 ---");
    const listingPriceUsd = 150 * 10**8; 
    
    // --- CHANGE: Added the missing variable declaration ---
    const listingId = 1;
    
    const dataIdentifier = "ipfs://super-rare-item";
    
    // a. Seller gets signature from trusted signer
    const domain = { name: 'ListingManager', version: '1', chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: addresses.ListingManager };
    const types = { CreateListing: [{ name: 'user', type: 'address' }, { name: 'dataIdentifier', type: 'string' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
    const value = { user: seller.address, dataIdentifier, nonce: 1, deadline: Math.floor(Date.now() / 1000) + 3600 };
    const signature = await trustedSigner.signTypedData(domain, types, value);

    // b. Seller approves fee and creates listing
    const feeInDai = ethers.parseEther("5");
    await mockDai.connect(seller).approve(addresses.ListingManager, feeInDai);
    await listingManager.connect(seller).createListing(0, listingPriceUsd, dataIdentifier, 1, value.deadline, signature);
    console.log(`Listing #${listingId} created successfully.`);
    await logBalances(contracts, accounts);

    // --- 4. BUYER BUYS LMKT ---
    console.log("--- 4. Buyer needs LMKT, buys $200 worth from Treasury ---");
    const daiToSpend = ethers.parseEther("200"); 
    await mockDai.connect(buyer).approve(addresses.Treasury, daiToSpend);
    await treasury.connect(buyer).buyMkt(daiToSpend, addresses.MockDai, 0); 
    console.log("Buyer purchased LMKT from Treasury.");
    await logBalances(contracts, accounts);

    // --- 5. BUYER PURCHASES LISTING ---
    console.log(`--- 5. Buyer purchases listing #${listingId} from Seller ---`);
    // a. Calculate required LMKT for the purchase
    const lmktPriceUsd = await treasury.getLmktPriceInUsd();
    const itemPriceInLmkt = (BigInt(listingPriceUsd) * (10n ** 18n)) / lmktPriceUsd;
    const commerceFee = await paymentProcessor.COMMERCE_FEE();
    const totalFeeInLmkt = (itemPriceInLmkt * commerceFee) / (await paymentProcessor.FEE_BASE());
    const totalAmountToPay = itemPriceInLmkt + totalFeeInLmkt;
    
    // b. Buyer approves and executes payment
    const maxLmktToPay = totalAmountToPay * 101n / 100n; // Allow 1% slippage
    await lmkt.connect(buyer).approve(addresses.PaymentProcessor, maxLmktToPay);
    await paymentProcessor.connect(buyer).executePayment(listingId, maxLmktToPay);
    console.log("Payment executed successfully!");
    
    // c. Final state check
    console.log("\n✅ Simulation Complete! Final State:");
    await logBalances(contracts, accounts);

    const listing = await listingManager.getListing(listingId);
    console.log(`Final status of Listing #${listingId}: ${Number(listing.status) === 1 ? 'Inactive' : 'Active'}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});