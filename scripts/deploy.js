// scripts/deploy.js
import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import process from "process";

function saveFrontendFiles(contracts) {
  console.log("\n--- Saving configuration and ABIs to frontend ---");
  const contractsDir = "./src/config";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + "/contract-addresses.json",
    JSON.stringify(
      {
        listingManager: contracts.ListingManager.target,
        treasury: contracts.Treasury.target,
        lmkt: contracts.LMKT.target,
        paymentProcessor: contracts.PaymentProcessor.target,
        faucet: contracts.Faucet.target,
        priceOracleConsumer: contracts.PriceOracleConsumer.target,
        mockDai: contracts.MockDai.target,
        lbrty: contracts.LBRTY.target,
        daiPriceFeed: contracts.DaiPriceFeed.target
      },
      null,
      2
    )
  );

  const artifactNames = [
    "ListingManager",
    "Treasury",
    "LMKT",
    "PaymentProcessor",
    "Faucet",
    "PriceOracleConsumer",
    "GenericERC20",
    "contracts/mocks/MockPriceFeed.sol:MockPriceFeed",
  ];

  for (const name of artifactNames) {
    const artifact = hardhat.artifacts.readArtifactSync(name);
    const fileName = name.includes(":") ? name.split(":")[1] : name;
    fs.writeFileSync(
      `${contractsDir}/${fileName}.json`,
      JSON.stringify(artifact, null, 2)
    );
  }

  console.log("✅ Frontend config + ABIs saved to /src/config");
}

async function main() {
  console.log("🚀 Starting full Sepolia deployment (UI-compatible)...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // --- Deploy Mock Tokens ---
  console.log("\n--- Deploying Mock Tokens ---");
  const GenericERC20 = await ethers.getContractFactory("GenericERC20");

  const mockDai = await GenericERC20.deploy("Mock DAI", "DAI", 18);
  await mockDai.waitForDeployment();
  console.log("MockDAI:", mockDai.target);

  const lbrty = await GenericERC20.deploy("Liberty Access Token", "LBRTY", 18);
  await lbrty.waitForDeployment();
  console.log("LBRTY:", lbrty.target);

  // --- Deploy LMKT ---
  console.log("\n--- Deploying LMKT ---");
  const LMKT = await ethers.getContractFactory("LMKT");
  const lmkt = await LMKT.deploy();
  await lmkt.waitForDeployment();
  console.log("LMKT:", lmkt.target);

  // --- Deploy Treasury + PaymentProcessor ---
  console.log("\n--- Deploying Treasury + PaymentProcessor ---");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury:", treasury.target);

  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(
    treasury.target,
    lmkt.target
  );
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor:", paymentProcessor.target);

  // --- Deploy Mock Price Feed ---
  console.log("\n--- Deploying Mock Price Feed ---");
  const MockPriceFeed = await ethers.getContractFactory(
    "contracts/mocks/MockPriceFeed.sol:MockPriceFeed"
  );
  const daiPriceFeed = await MockPriceFeed.deploy(ethers.parseUnits("1", 8), 8); // $1, 8 decimals
  await daiPriceFeed.waitForDeployment();
  console.log("DAI Price Feed:", daiPriceFeed.target);

  // --- Deploy PriceOracleConsumer with dummy ---
  console.log("\n--- Deploying PriceOracleConsumer ---");
  const PriceOracleConsumerFactory = await ethers.getContractFactory("PriceOracleConsumer");
  const priceOracleConsumer = await PriceOracleConsumerFactory.deploy(
    "0x0000000000000000000000000000000000000001"
  );
  await priceOracleConsumer.waitForDeployment();
  console.log("PriceOracleConsumer:", priceOracleConsumer.target);

  // --- Deploy ListingManager ---
  console.log("\n--- Deploying ListingManager ---");
  const ListingManager = await ethers.getContractFactory("ListingManager");
  const listingManager = await ListingManager.deploy(
    treasury.target,
    lmkt.target,
    deployer.address // trusted signer
  );
  await listingManager.waitForDeployment();
  console.log("ListingManager:", listingManager.target);

  // --- Deploy Faucet ---
  console.log("\n--- Deploying Faucet ---");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(mockDai.target);
  await faucet.waitForDeployment();
  console.log("Faucet:", faucet.target);

  await (await mockDai.addMinter(faucet.target)).wait();
  console.log("✅ Faucet added as minter for MockDAI");
  await (await lbrty.addMinter(faucet.target)).wait();
  console.log("✅ Faucet added as minter for LBRTY");

  // --- Configure Treasury ---
  console.log("\n--- Configuring Treasury ---");
  await (await treasury.setLmktAddress(lmkt.target)).wait();
  await (await treasury.setWhitelistedCollateral(mockDai.target, true)).wait();
  await (await treasury.setPriceFeed(mockDai.target, daiPriceFeed.target)).wait();

  const USDT_USD_QUERY_ID = ethers.keccak256(
    ethers.toUtf8Bytes("USDT/USD")
  );
  await (await treasury.setTokenQueryId(mockDai.target, USDT_USD_QUERY_ID)).wait();
  console.log("✅ Treasury configured with DAI feed + whitelist");

  // --- Provision Liquidity (MUST seed Treasury reserves like in main) ---
  console.log("\n--- Provisioning Initial Liquidity ---");
  await (await mockDai.mint(treasury.target, ethers.parseEther("25000"))).wait();
  console.log("✅ Seeded Treasury with 25,000 MockDAI");

  const initialSupply = await lmkt.totalSupply();
  await (await lmkt.transfer(treasury.target, initialSupply)).wait();
  console.log("✅ Transferred LMKT supply to Treasury");

  await (await lmkt.transferOwnership(treasury.target)).wait();
  console.log("✅ Transferred LMKT ownership to Treasury");

  // --- Save Frontend Files ---
  saveFrontendFiles({
    ListingManager: listingManager,
    Treasury: treasury,
    LMKT: lmkt,
    PaymentProcessor: paymentProcessor,
    Faucet: faucet,
    PriceOracleConsumer: priceOracleConsumer,
    MockDai: mockDai,
    LBRTY: lbrty,
    DaiPriceFeed: daiPriceFeed,
  });

  console.log("\n🎉 Deployment complete!");
  console.log("\n🔑 Final Contract Addresses:");
  console.log("Treasury:", treasury.target);
  console.log("LMKT:", lmkt.target);
  console.log("LBRTY:", lbrty.target);
  console.log("MockDAI:", mockDai.target);
  console.log("PaymentProcessor:", paymentProcessor.target);
  console.log("Faucet:", faucet.target);
  console.log("DaiPriceFeed:", daiPriceFeed.target);
  console.log("ListingManager:", listingManager.target);
  console.log("PriceOracleConsumer:", priceOracleConsumer.target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
