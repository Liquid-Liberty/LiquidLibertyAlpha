import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import "dotenv/config";
import process from "process";

// --- Save contract addresses per network ---
async function saveFrontendFiles(contracts) {
  console.log("\n--- Saving configuration and ABIs to frontend ---");

  // Get the current network name (e.g., 'sepolia', 'pulse', 'localhost')
  const network = await ethers.provider.getNetwork();
  const networkName = network.name || `chain-${network.chainId}`;

  const contractsDir = `./src/config/${networkName}`;
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const addressFilePath = `${contractsDir}/contract-addresses.json`;

  // Save the contract addresses
  fs.writeFileSync(
    addressFilePath,
    JSON.stringify(
      {
        ListingManager: contracts.ListingManager.target,
        PaymentProcessor: contracts.PaymentProcessor.target,
        Treasury: contracts.Treasury.target,
        LMKT: contracts.LMKT.target,
        MockDai: contracts.MockDai.target,
        Faucet: contracts.Faucet.target,
        MockPriceOracle: contracts.MockPriceOracle.target,
      },
      undefined,
      2
    )
  );

  console.log(`✅ Contract addresses saved to ${addressFilePath}`);
}

// --- Save ABIs at config root (shared across networks) ---
async function saveAbisAtConfigRoot() {
  const abis = [
    "ListingManager",
    "PaymentProcessor",
    "Treasury",
    "LMKT",
    "GenericERC20",
    "Faucet",
  ];

  for (const name of abis) {
    const artifact = await hardhat.artifacts.readArtifact(name);
    const targetPath = `./src/config/${name}.json`;
    fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✔ ABI for ${name} saved at ${targetPath}`);
  }
}

async function main() {
  console.log("🚀 Starting deployment of all contracts...");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

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

  // --- 3. CONFIGURE ALL CONTRACTS ---
  console.log("\n--- Configuring all contracts ---");

  const daiQueryId = ethers.keccak256(ethers.toUtf8Bytes("mDAI/USD"));
  await mockOracle.setPrice(daiQueryId, ethers.parseUnits("1", 8));
  console.log("Oracle configured: Mock DAI price set to $1.00");

  await treasury.setLmktAddress(lmkt.target);
  console.log("Treasury: LMKT address set.");

  console.log("Treasury: Attempting to whitelist MockDai as collateral.");
  const tx1 = await treasury.setWhitelistedCollateral(mockDai.target, true);
  await tx1.wait();
  console.log("Treasury: MockDai whitelisted as collateral.");

  const isWhitelisted = await treasury.isWhitelistedCollateral(mockDai.target);
  console.log("Treasury reports MockDai whitelist status:", isWhitelisted);

  console.log("Treasury: Attempting to set queryID for MockDai.");
  const tx2 = await treasury.setTokenQueryId(mockDai.target, daiQueryId);
  await tx2.wait();
  console.log("Treasury: QueryId set for MockDai.");

  const tx3 = await treasury.setPriceFeed(mockDai.target, mockOracle.target);
  await tx3.wait();
  console.log("Treasury: Price feed set for MockDAI at", mockOracle.target);

  const storedFeed = await treasury.tokenPriceFeeds(mockDai.target);
  console.log("Treasury reports stored price feed for MockDAI:", storedFeed);

  const storedQueryId = await treasury.tokenQueryIds(mockDai.target);
  console.log("Treasury reports stored queryId for MockDAI:", storedQueryId);

  const oraclePrice = await mockOracle.getPrice(daiQueryId);
  console.log("MockOracle price for DAI:", oraclePrice.toString());

  // --- 4. SEED TREASURY WITH INITIAL COLLATERAL ---
  console.log("\n--- Seeding Treasury with initial collateral ---");
  await mockDai.mint(treasury.target, ethers.parseEther("1000"));
  console.log("Treasury seeded with $1,000 of MockDai.");

  // c. Configure LMKT Token
  const initialLmktSupply = await lmkt.totalSupply();
  await lmkt.transfer(treasury.target, initialLmktSupply);
  await lmkt.transferOwnership(treasury.target);
  console.log("LMKT configured: Initial supply and ownership transferred to Treasury.");

  // d. Configure MockDai Token
  await mockDai.addMinter(faucet.target);
  console.log("MockDai configured: Faucet has been added as a minter.");

  // e. Configure ListingManager
  await listingManager.setPaymentProcessor(paymentProcessor.target);
  console.log("ListingManager configured: PaymentProcessor address set.");

  // --- 5. SAVE FRONTEND FILES ---
  await saveFrontendFiles({
    ListingManager: listingManager,
    PaymentProcessor: paymentProcessor,
    Treasury: treasury,
    LMKT: lmkt,
    MockDai: mockDai,
    Faucet: faucet,
    MockPriceOracle: mockOracle,
  });

  await saveAbisAtConfigRoot();

  const priceFeed = await treasury.tokenPriceFeeds(mockDai.target);
  console.log("Treasury reports price feed for MockDAI:", priceFeed);

  const queryId = await treasury.tokenQueryIds(mockDai.target);
  console.log("Treasury reports queryId for MockDAI:", queryId);

  console.log("\n✅ Deployment and configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
