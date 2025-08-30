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
        treasury: contracts.Treasury.target,
        lmkt: contracts.LMKT.target,
        paymentProcessor: contracts.PaymentProcessor.target,
        faucet: contracts.Faucet.target,
        mockDai: contracts.MockDai.target,
        daiPriceFeed: contracts.DaiPriceFeed.target,
        listingManager: contracts.ListingManager.target,
        priceOracleConsumer: contracts.PriceOracleConsumer.target,
      },
      null,
      2
    )
  );

  const artifactNames = [
    "Treasury",
    "LMKT",
    "PaymentProcessor",
    "Faucet",
    "ListingManager",
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
  console.log("🚀 Starting full Sepolia deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // --- Deploy Mock DAI + LMKT ---
  console.log("\n--- Deploying Mock DAI + LMKT ---");
  const GenericERC20 = await ethers.getContractFactory("GenericERC20");
  const LMKT = await ethers.getContractFactory("LMKT");

  const mockDai = await GenericERC20.deploy("Mock DAI", "DAI", 18);
  await mockDai.waitForDeployment();
  console.log("MockDAI:", mockDai.target);

  const lmkt = await LMKT.deploy();
  await lmkt.waitForDeployment();
  console.log("LMKT:", lmkt.target);

  // --- Deploy Treasury + PaymentProcessor ---
  console.log("\n--- Deploying Treasury + PaymentProcessor ---");
  const Treasury = await ethers.getContractFactory("Treasury");
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");

  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury:", treasury.target);

  const paymentProcessor = await PaymentProcessor.deploy(
    treasury.target,
    lmkt.target
  );
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor:", paymentProcessor.target);

  // --- Deploy Mock Price Feed for DAI ---
  console.log("\n--- Deploying Mock Price Feed ---");
  const MockPriceFeed = await ethers.getContractFactory(
    "contracts/mocks/MockPriceFeed.sol:MockPriceFeed"
  );
  const daiPriceFeed = await MockPriceFeed.deploy(ethers.parseUnits("1", 8), 8); // $1 with 8 decimals
  await daiPriceFeed.waitForDeployment();
  console.log("DAI Price Feed:", daiPriceFeed.target);

  // --- Deploy Faucet ---
  console.log("\n--- Deploying Faucet ---");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(mockDai.target);
  await faucet.waitForDeployment();
  console.log("Faucet:", faucet.target);

  // --- Deploy PriceOracleConsumer ---
  console.log("\n--- Deploying PriceOracleConsumer ---");
  const PriceOracleConsumerFactory = await ethers.getContractFactory("PriceOracleConsumer");
  const priceOracleConsumer = await PriceOracleConsumerFactory.deploy(deployer.address);
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

  // --- Configure MockDAI minters ---
  console.log("\n--- Configuring MockDAI minters ---");
  await (await mockDai.addMinter(faucet.target)).wait();
  console.log("✅ Faucet added as minter for MockDAI");

  await (await mockDai.addMinter(treasury.target)).wait();
  console.log("✅ Treasury added as minter for MockDAI");

  await (await mockDai.transferOwnership(faucet.target)).wait();
  console.log("✅ Faucet is now owner of MockDAI");

  // --- Configure Treasury ---
  console.log("\n--- Configuring Treasury ---");
  await (await treasury.setLmktAddress(lmkt.target)).wait();
  await (await treasury.setWhitelistedCollateral(mockDai.target, true)).wait();

  // Wire Treasury to PriceOracleConsumer, not MockPriceFeed
  const USDT_USD_QUERY_ID = ethers.keccak256(
    ethers.toUtf8Bytes("USDT/USD")
  );
  await (await treasury.setPriceFeed(mockDai.target, priceOracleConsumer.target)).wait();
  await (await treasury.setTokenQueryId(mockDai.target, USDT_USD_QUERY_ID)).wait();

  // Seed PriceOracleConsumer with initial price
  await (await priceOracleConsumer.updatePrice(
    USDT_USD_QUERY_ID,
    ethers.parseUnits("1", 8) // 1 USD
  )).wait();
  console.log("✅ Treasury configured with DAI feed + whitelist via PriceOracleConsumer");

  // --- Provision Liquidity ---
  console.log("\n--- Provisioning Initial Liquidity ---");
  await (await mockDai.mint(treasury.target, ethers.parseEther("25000"))).wait();
  await (await lmkt.transfer(treasury.target, await lmkt.totalSupply())).wait();
  await (await lmkt.transferOwnership(treasury.target)).wait();
  console.log("✅ Treasury funded + owns LMKT");

  // --- Save Frontend Files ---
  saveFrontendFiles({
    Treasury: treasury,
    LMKT: lmkt,
    PaymentProcessor: paymentProcessor,
    Faucet: faucet,
    MockDai: mockDai,
    DaiPriceFeed: daiPriceFeed,
    ListingManager: listingManager,
    PriceOracleConsumer: priceOracleConsumer,
  });

  console.log("\n🎉 Deployment complete!");
  console.log("\n🔑 Final Contract Addresses:");
  console.log("Treasury:", treasury.target);
  console.log("LMKT:", lmkt.target);
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
