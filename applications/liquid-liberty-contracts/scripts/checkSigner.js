// scripts/checkSigner.js
import { Wallet, ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import process from "process";

dotenv.config();

// Load config JSONs manually
const contractAddresses = JSON.parse(
  fs.readFileSync(path.resolve("./src/config/contract-addresses.json"))
);
const ListingManagerABI = JSON.parse(
  fs.readFileSync(path.resolve("./src/config/ListingManager.json"))
);

const pk = process.env.SIGNER_PRIVATE_KEY;
if (!pk) {
  console.error("❌ SIGNER_PRIVATE_KEY missing in .env");
  process.exit(1);
}

const wallet = new Wallet(pk.startsWith("0x") ? pk : `0x${pk}`);
console.log("✅ Backend signer address:", wallet.address);

// Sepolia RPC
const rpcUrl = process.env.SEPOLIA_RPC_URL;
if (!rpcUrl) {
  console.error("❌ SEPOLIA_RPC_URL missing in .env");
  process.exit(1);
}
const provider = new ethers.JsonRpcProvider(rpcUrl);

const listingManager = new ethers.Contract(
  contractAddresses.ListingManager,
  ListingManagerABI.abi,
  provider
);

const main = async () => {
  const trustedSigner = await listingManager.trustedSigner();
  console.log("✅ Contract trustedSigner:", trustedSigner);

  if (trustedSigner.toLowerCase() === wallet.address.toLowerCase()) {
    console.log("🎉 MATCH: Backend signer matches contract trustedSigner!");
  } else {
    console.log("❌ MISMATCH: Backend signer does NOT match contract trustedSigner.");
  }
};

main().catch(console.error);
