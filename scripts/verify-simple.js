import hardhat from "hardhat";
const { ethers } = hardhat;
import 'dotenv/config';

async function main() {
  console.log("Starting simple contract verification...");
  
  // Get the deployed contract addresses from the saved configuration
  const contractAddresses = JSON.parse(
    await hardhat.readFile("./src/config/contract-addresses.json")
  );
  
  console.log("Contract addresses to verify:", contractAddresses);
  
  // Verify Mock Tokens
  console.log("\n--- Verifying Mock Tokens ---");
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockDai,
      constructorArguments: ["Mock DAI", "DAI", 18],
    });
    console.log("✅ MockDAI verified");
  } catch (error) {
    console.log("❌ MockDAI verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWeth,
      constructorArguments: ["Mock WETH", "WETH", 18],
    });
    console.log("✅ MockWETH verified");
  } catch (error) {
    console.log("❌ MockWETH verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWbtc,
      constructorArguments: ["Mock WBTC", "WBTC", 8],
    });
    console.log("✅ MockWBTC verified");
  } catch (error) {
    console.log("❌ MockWBTC verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockPls,
      constructorArguments: ["Mock PLS", "PLS", 18],
    });
    console.log("✅ MockPLS verified");
  } catch (error) {
    console.log("❌ MockPLS verification failed:", error.message);
  }
  
  // Verify Mock Price Feeds
  console.log("\n--- Verifying Mock Price Feeds ---");
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockDaiPriceFeed,
      constructorArguments: [ethers.parseUnits("1.00", 8), 8],
    });
    console.log("✅ MockDAI Price Feed verified");
  } catch (error) {
    console.log("❌ MockDAI Price Feed verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWethPriceFeed,
      constructorArguments: [ethers.parseUnits("3000.00", 8), 8],
    });
    console.log("✅ MockWETH Price Feed verified");
  } catch (error) {
    console.log("❌ MockWETH Price Feed verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWbtcPriceFeed,
      constructorArguments: [ethers.parseUnits("60000.00", 8), 8],
    });
    console.log("✅ MockWBTC Price Feed verified");
  } catch (error) {
    console.log("❌ MockWBTC Price Feed verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockPlsPriceFeed,
      constructorArguments: [ethers.parseUnits("0.000045", 8), 8],
    });
    console.log("✅ MockPLS Price Feed verified");
  } catch (error) {
    console.log("❌ MockPLS Price Feed verification failed:", error.message);
  }
  
  // Verify Core Contracts
  console.log("\n--- Verifying Core Contracts ---");
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.lmkt,
      constructorArguments: [],
    });
    console.log("✅ LMKT verified");
  } catch (error) {
    console.log("❌ LMKT verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.treasury,
      constructorArguments: [],
    });
    console.log("✅ Treasury verified");
  } catch (error) {
    console.log("❌ Treasury verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.priceOracleConsumer,
      constructorArguments: ["0x0000000000000000000000000000000000000001"],
    });
    console.log("✅ PriceOracleConsumer verified");
  } catch (error) {
    console.log("❌ PriceOracleConsumer verification failed:", error.message);
  }
  
  try {
    const trustedSignerAddress = process.env.SIGNER_PRIVATE_KEY ? 
      new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).address : 
      "0x0000000000000000000000000000000000000000";
    
    await hardhat.run("verify:verify", {
      address: contractAddresses.listingManager,
      constructorArguments: [
        contractAddresses.treasury,
        contractAddresses.lmkt,
        trustedSignerAddress
      ],
    });
    console.log("✅ ListingManager verified");
  } catch (error) {
    console.log("❌ ListingManager verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.paymentProcessor,
      constructorArguments: [
        contractAddresses.treasury,
        contractAddresses.lmkt
      ],
    });
    console.log("✅ PaymentProcessor verified");
  } catch (error) {
    console.log("❌ PaymentProcessor verification failed:", error.message);
  }
  
  try {
    await hardhat.run("verify:verify", {
      address: contractAddresses.faucet,
      constructorArguments: [
        contractAddresses.mockDai,
        contractAddresses.mockWeth,
        contractAddresses.mockWbtc,
        contractAddresses.mockPls
      ],
    });
    console.log("✅ Faucet verified");
  } catch (error) {
    console.log("❌ Faucet verification failed:", error.message);
  }
  
  console.log("\n✅ Verification process completed!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
