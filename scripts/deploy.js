import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import "dotenv/config";

// This helper function saves the contract addresses and ABIs to the front-end directory
async function saveFrontendFiles(contracts) {
  console.log("\n--- Saving configuration and ABIs to frontend ---");
  const contractsDir = "./src/config";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save the contract addresses
  fs.writeFileSync(
    contractsDir + "/contract-addresses.json",
    JSON.stringify(
      {
        ListingManager: contracts.listingManager.target,
        PaymentProcessor: contracts.paymentProcessor.target,
        Treasury: contracts.treasury.target,
        LMKT: contracts.lmkt.target,
        MockDai: contracts.mockDai.target,
        Faucet: contracts.faucet.target,
        MockPriceOracle: contracts.mockOracle.target,
      },
      undefined,
      2
    )
  );

  // Save the contract ABIs
  const ListingManagerArtifact = await hardhat.artifacts.readArtifact("ListingManager");
  fs.writeFileSync(contractsDir + "/ListingManager.json", JSON.stringify(ListingManagerArtifact, null, 2));
  
  const PaymentProcessorArtifact = await hardhat.artifacts.readArtifact("PaymentProcessor");
  fs.writeFileSync(contractsDir + "/PaymentProcessor.json", JSON.stringify(PaymentProcessorArtifact, null, 2));
  
  const TreasuryArtifact = await hardhat.artifacts.readArtifact("Treasury");
  fs.writeFileSync(contractsDir + "/Treasury.json", JSON.stringify(TreasuryArtifact, null, 2));

  const LmktArtifact = await hardhat.artifacts.readArtifact("LMKT");
  fs.writeFileSync(contractsDir + "/LMKT.json", JSON.stringify(LmktArtifact, null, 2));

  const GenericERC20Artifact = await hardhat.artifacts.readArtifact("GenericERC20");
  fs.writeFileSync(contractsDir + "/GenericERC20.json", JSON.stringify(GenericERC20Artifact, null, 2));

  console.log("✅ Frontend files saved successfully to /src/config");
}

async function main() {
  console.log("🚀 Starting deployment of all contracts...");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Create the trusted signer wallet from .env for ListingManager
  if (!process.env.SIGNER_PRIVATE_KEY) {
    throw new Error("SIGNER_PRIVATE_KEY is not set in the .env file.");
  }
  const trustedSigner = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY);
  console.log("🔑 Trusted Signer for ListingManager:", trustedSigner.address);

  // --- 1. DEPLOY DEPENDENCIES ---
  console.log("\n--- Deploying dependencies ---");
  const MockOracleFactory = await ethers.getContractFactory("MockPriceOracle");
  const mockOracle = await MockOracleFactory.deploy();
  await mockOracle.waitForDeployment();
  console.log("MockPriceOracle deployed to:", mockOracle.target);

  const MockDaiFactory = await ethers.getContractFactory("GenericERC20");
  const mockDai = await MockDaiFactory.deploy("Mock DAI", "mDAI", 18);
  await mockDai.waitForDeployment();
  console.log("MockDai (GenericERC20) deployed to:", mockDai.target);

  const LmktFactory = await ethers.getContractFactory("LMKT");
  const lmkt = await LmktFactory.deploy();
  await lmkt.waitForDeployment();
  console.log("LMKT deployed to:", lmkt.target);

  // --- 2. DEPLOY CORE CONTRACTS ---
  console.log("\n--- Deploying core contracts ---");
  const TreasuryFactory = await ethers.getContractFactory("Treasury");
  const treasury = await TreasuryFactory.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury deployed to:", treasury.target);

  const ListingManagerFactory = await ethers.getContractFactory("ListingManager");
  const listingManager = await ListingManagerFactory.deploy(
    treasury.target,
    mockDai.target,
    trustedSigner.address
  );
  await listingManager.waitForDeployment();
  console.log("ListingManager deployed to:", listingManager.target);

  const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessorFactory.deploy(
    treasury.target,
    listingManager.target,
    lmkt.target
  );
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor deployed to:", paymentProcessor.target);

  const FaucetFactory = await ethers.getContractFactory("Faucet");
  const faucet = await FaucetFactory.deploy(mockDai.target);
  await faucet.waitForDeployment();
  console.log("Faucet deployed to:", faucet.target);

  // --- 3. SEED TREASURY WITH INITIAL COLLATERAL ---
  console.log("\n--- Seeding Treasury with initial collateral ---");
  await mockDai.mint(treasury.target, ethers.parseEther("1000000")); // Seed with $1M
  console.log("Treasury seeded with $1,000,000 of MockDai.");


  // --- 4. CONFIGURE ALL CONTRACTS ---
  console.log("\n--- Configuring all contracts ---");

  // a. Configure Oracle
  const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
  await mockOracle.setPrice(daiQueryId, 1 * 10 ** 8); // $1.00 with 8 decimals
  console.log("Oracle configured: Mock DAI price set to $1.00");

  // b. Configure Treasury
  await treasury.setLmktAddress(lmkt.target);
  await treasury.setWhitelistedCollateral(mockDai.target, true);
  await treasury.setPriceFeed(mockDai.target, mockOracle.target);
  await treasury.setTokenQueryId(mockDai.target, daiQueryId);
  console.log("Treasury configured: LMKT address, collateral, and price feed set.");

  // c. Configure LMKT Token
  const initialLmktSupply = await lmkt.totalSupply();
  await lmkt.transfer(treasury.target, initialLmktSupply);
  await lmkt.transferOwnership(treasury.target);
  console.log("LMKT configured: Initial supply and ownership transferred to Treasury.");

  // d. Configure MockDai Token
  await mockDai.addMinter(faucet.target);
  console.log("MockDai configured: Faucet has been added as a minter.");
  
  // --- 5. SAVE FRONTEND FILES ---
  await saveFrontendFiles({
    listingManager,
    paymentProcessor,
    treasury,
    lmkt,
    mockDai,
    faucet,
    mockOracle
  });

  console.log("\n✅ Deployment and configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});