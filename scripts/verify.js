import hardhat from "hardhat";
const { ethers } = hardhat;
import 'dotenv/config';
import fs from 'fs';

async function main() {
  console.log("Starting contract verification...");
  
  // Get the deployed contract addresses from the saved configuration
  const contractAddresses = JSON.parse(
    fs.readFileSync("./src/config/contract-addresses.json", "utf8")
  );
  
  console.log("Contract addresses to verify:", contractAddresses);
  
  try {
    // Verify Mock Tokens
    console.log("\n--- Verifying Mock Tokens ---");
    
    console.log("Verifying MockDAI...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockDai,
      constructorArguments: ["Mock DAI", "DAI", 18],
      network: "sepolia"
    });
    
    console.log("Verifying MockWETH...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWeth,
      constructorArguments: ["Mock WETH", "WETH", 18],
      network: "sepolia"
    });
    
    console.log("Verifying MockWBTC...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWbtc,
      constructorArguments: ["Mock WBTC", "WBTC", 8],
      network: "sepolia"
    });
    
    console.log("Verifying MockPLS...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockPls,
      constructorArguments: ["Mock PLS", "PLS", 18],
      network: "sepolia"
    });
    
    // Verify Mock Price Feeds
    console.log("\n--- Verifying Mock Price Feeds ---");
    
    console.log("Verifying MockDAI Price Feed...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockDaiPriceFeed,
      constructorArguments: [ethers.parseUnits("1.00", 8), 8],
      network: "sepolia"
    });
    
    console.log("Verifying MockWETH Price Feed...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWethPriceFeed,
      constructorArguments: [ethers.parseUnits("3000.00", 8), 8],
      network: "sepolia"
    });
    
    console.log("Verifying MockWBTC Price Feed...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockWbtcPriceFeed,
      constructorArguments: [ethers.parseUnits("60000.00", 8), 8],
      network: "sepolia"
    });
    
    console.log("Verifying MockPLS Price Feed...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.mockPlsPriceFeed,
      constructorArguments: [ethers.parseUnits("0.000045", 8), 8],
      network: "sepolia"
    });
    
    // Verify Core Contracts
    console.log("\n--- Verifying Core Contracts ---");
    
    console.log("Verifying LMKT...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.lmkt,
      constructorArguments: [],
      network: "sepolia"
    });
    
    console.log("Verifying Treasury...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.treasury,
      constructorArguments: [],
      network: "sepolia"
    });
    
    console.log("Verifying PriceOracleConsumer...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.priceOracleConsumer,
      constructorArguments: ["0x0000000000000000000000000000000000000001"],
      network: "sepolia"
    });
    
    console.log("Verifying ListingManager...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.listingManager,
      constructorArguments: [
        contractAddresses.treasury,
        contractAddresses.lmkt,
        process.env.SIGNER_PRIVATE_KEY ? 
          new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).address : 
          "0x0000000000000000000000000000000000000000"
      ],
      network: "sepolia"
    });
    
    console.log("Verifying PaymentProcessor...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.paymentProcessor,
      constructorArguments: [
        contractAddresses.treasury,
        contractAddresses.lmkt
      ],
      network: "sepolia"
    });
    
    console.log("Verifying Faucet...");
    await hardhat.run("verify:verify", {
      address: contractAddresses.faucet,
      constructorArguments: [
        contractAddresses.mockDai,
        contractAddresses.mockWeth,
        contractAddresses.mockWbtc,
        contractAddresses.mockPls
      ],
      network: "sepolia"
    });
    
    console.log("\n✅ All contracts verified successfully!");
    
  } catch (error) {
    console.error("Verification failed:", error.message);
    
    // If verification fails, provide manual verification commands
    console.log("\n--- Manual Verification Commands ---");
    console.log("You can manually verify contracts using these commands:");
    console.log("\nMock Tokens:");
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockDai} "Mock DAI" "DAI" 18`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockWeth} "Mock WETH" "WETH" 18`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockWbtc} "Mock WBTC" "WBTC" 8`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockPls} "Mock PLS" "PLS" 18`);
    
    console.log("\nMock Price Feeds:");
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockDaiPriceFeed} 100000000 8`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockWethPriceFeed} 300000000000 8`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockWbtcPriceFeed} 6000000000000 8`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.mockPlsPriceFeed} 4500 8`);
    
    console.log("\nCore Contracts:");
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.lmkt}`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.treasury}`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.priceOracleConsumer} "0x0000000000000000000000000000000000000001"`);
    
    const trustedSignerAddress = process.env.SIGNER_PRIVATE_KEY ? 
      new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).address : 
      "0x0000000000000000000000000000000000000000";
    
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.listingManager} ${contractAddresses.treasury} ${contractAddresses.lmkt} ${trustedSignerAddress}`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.paymentProcessor} ${contractAddresses.treasury} ${contractAddresses.lmkt}`);
    console.log(`npx hardhat verify --network sepolia ${contractAddresses.faucet} ${contractAddresses.mockDai} ${contractAddresses.mockWeth} ${contractAddresses.mockWbtc} ${contractAddresses.mockPls}`);
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
