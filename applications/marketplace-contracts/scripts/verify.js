import hardhat from "hardhat";
const { ethers } = hardhat;
import "dotenv/config";
import fs from "fs";

async function main() {
  console.log("🔍 Starting contract verification...");

  // Get the deployed contract addresses from the saved configuration
  const contractAddresses = JSON.parse(
    fs.readFileSync("./src/config/contract-addresses.json", "utf8")
  );
  console.log("Verifying contracts with addresses:", contractAddresses);

  // Recreate the trustedSigner address from .env for verification
  if (!process.env.SIGNER_PRIVATE_KEY) {
    throw new Error("SIGNER_PRIVATE_KEY is not set in the .env file.");
  }
  const trustedSignerAddress = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).address;

  // --- Verify Mock Contracts ---
  console.log("\n--- Verifying Mock Contracts ---");
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.MockPriceOracle,
      constructorArguments: [],
    });
    console.log("✅ MockPriceOracle verified");
  } catch (error) {
    console.log("❌ MockPriceOracle verification failed:", error.message);
  }

  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.MockDai,
      constructorArguments: ["Mock DAI", "mDAI", 18],
    });
    console.log("✅ MockDai (GenericERC20) verified");
  } catch (error) {
    console.log("❌ MockDai verification failed:", error.message);
  }

  // --- Verify Core Contracts ---
  console.log("\n--- Verifying Core Contracts ---");
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.LMKT,
      constructorArguments: [],
    });
    console.log("✅ LMKT verified");
  } catch (error) {
    console.log("❌ LMKT verification failed:", error.message);
  }

  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.Treasury,
      constructorArguments: [],
    });
    console.log("✅ Treasury verified");
  } catch (error) {
    console.log("❌ Treasury verification failed:", error.message);
  }

  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.ListingManager,
      constructorArguments: [
        contractAddresses.Treasury,
        contractAddresses.MockDai,
        trustedSignerAddress,
      ],
    });
    console.log("✅ ListingManager verified");
  } catch (error) {
    console.log("❌ ListingManager verification failed:", error.message);
  }

  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.PaymentProcessor,
      constructorArguments: [
        contractAddresses.Treasury,
        contractAddresses.ListingManager,
        contractAddresses.LMKT,
      ],
    });
    console.log("✅ PaymentProcessor verified");
  } catch (error) {
    console.log("❌ PaymentProcessor verification failed:", error.message);
  }

  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.Faucet,
      constructorArguments: [contractAddresses.MockDai],
    });
    console.log("✅ Faucet verified");
  } catch (error) {
    console.log("❌ Faucet verification failed:", error.message);
  }

  console.log("\n✅ Verification script finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});