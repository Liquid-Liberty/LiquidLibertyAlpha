import hardhat from "hardhat";
const { ethers } = hardhat;
import 'dotenv/config';
import fs from 'fs';

function saveFrontendFiles(contracts) {
  console.log("\n--- Saving configuration and ABIs to frontend ---");
  const contractsDir = "./src/config";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(contractsDir + "/contract-addresses.json", JSON.stringify({
    listingManager: contracts.ListingManager.target,
    treasury: contracts.Treasury.target,
    lmkt: contracts.LMKT.target,
    paymentProcessor: contracts.PaymentProcessor.target,
    faucet: contracts.Faucet.target,
    priceOracleConsumer: contracts.PriceOracleConsumer.target,
    mockDai: contracts.MockDai.target,
    // mockWeth: contracts.MockWeth.target,
    // mockWbtc: contracts.MockWbtc.target,
    // mockPls: contracts.MockPls.target
  }, undefined, 2));

  const ListingManagerArtifact = hre.artifacts.readArtifactSync("ListingManager");
  fs.writeFileSync(contractsDir + "/ListingManager.json", JSON.stringify(ListingManagerArtifact, null, 2));
  const TreasuryArtifact = hre.artifacts.readArtifactSync("Treasury");
  fs.writeFileSync(contractsDir + "/Treasury.json", JSON.stringify(TreasuryArtifact, null, 2));
  const LmktArtifact = hre.artifacts.readArtifactSync("LMKT");
  fs.writeFileSync(contractsDir + "/LMKT.json", JSON.stringify(LmktArtifact, null, 2));
  const PaymentProcessorArtifact = hre.artifacts.readArtifactSync("PaymentProcessor");
  fs.writeFileSync(contractsDir + "/PaymentProcessor.json", JSON.stringify(PaymentProcessorArtifact, null, 2));
  const GenericERC20Artifact = hre.artifacts.readArtifactSync("GenericERC20");
  fs.writeFileSync(contractsDir + "/GenericERC20.json", JSON.stringify(GenericERC20Artifact, null, 2));
  const FaucetArtifact = hre.artifacts.readArtifactSync("Faucet");
  fs.writeFileSync(contractsDir + "/Faucet.json", JSON.stringify(FaucetArtifact, null, 2));
  const PriceOracleConsumerArtifact = hre.artifacts.readArtifactSync("PriceOracleConsumer");
  fs.writeFileSync(contractsDir + "/PriceOracleConsumer.json", JSON.stringify(PriceOracleConsumerArtifact, null, 2));

  console.log("Frontend configuration and ABIs saved successfully to /src/config");
}

async function main() {
  console.log("Starting The Market Protocol deployment...");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  if (!signerPrivateKey || !signerPrivateKey.startsWith('0x')) {
    throw new Error("SIGNER_PRIVATE_KEY is not set or invalid in the .env file.");
  }
  const trustedSigner = new ethers.Wallet(signerPrivateKey);
  console.log("Backend Trusted Signer address for ListingManager:", trustedSigner.address);

  const staticPrices = { dai: 1.00, weth: 3000.00, wbtc: 60000.00, pls: 0.000045 };
  console.log("\n--- Using static prices for initial mock price feed deployment ---");
  console.log(staticPrices);
  
  console.log("\n--- Deploying Mock Tokens ---");
  const GenericERC20 = await ethers.getContractFactory("GenericERC20");
  const mockDai = await GenericERC20.deploy("Mock DAI", "DAI", 18);
  await mockDai.waitForDeployment();
  console.log("MockDAI deployed to:", mockDai.target);
  // const mockWeth = await GenericERC20.deploy("Mock WETH", "WETH", 18);
  // await mockWeth.waitForDeployment();
  // console.log("MockWETH deployed to:", mockWeth.target);
  // const mockWbtc = await GenericERC20.deploy("Mock WBTC", "WBTC", 8);
  // await mockWbtc.waitForDeployment();
  // console.log("MockWBTC deployed to:", mockWbtc.target);
  // const mockPls = await GenericERC20.deploy("Mock PLS", "PLS", 18);
  // await mockPls.waitForDeployment();
  // console.log("MockPLS deployed to:", mockPls.target);
  const lbrty = await GenericERC20.deploy("Liberty Access Token", "LBRTY", 18);
  await lbrty.waitForDeployment();
  console.log("LBRTY token deployed to:", lbrty.target);
  
  console.log("\n--- Deploying Updatable Mock Price Feeds ---");
  const MockPriceFeed = await ethers.getContractFactory("contracts/mocks/MockPriceFeed.sol:MockPriceFeed");
  const priceToBigInt = (price, decimals = 8) => BigInt(Math.round(price * (10 ** decimals)));
  const daiPriceFeed = await MockPriceFeed.deploy(priceToBigInt(staticPrices.dai), 8);
  await daiPriceFeed.waitForDeployment();
  console.log(`MockDAI Price Feed deployed to: ${daiPriceFeed.target}`);
  // const wethPriceFeed = await MockPriceFeed.deploy(priceToBigInt(staticPrices.weth), 8);
  // await wethPriceFeed.waitForDeployment();
  // console.log(`MockWETH Price Feed deployed to: ${wethPriceFeed.target}`);
  // const wbtcPriceFeed = await MockPriceFeed.deploy(priceToBigInt(staticPrices.wbtc), 8);
  // await wbtcPriceFeed.waitForDeployment();
  // console.log(`MockWBTC Price Feed deployed to: ${wbtcPriceFeed.target}`);
  // const plsPriceFeed = await MockPriceFeed.deploy(priceToBigInt(staticPrices.pls), 8);
  // await plsPriceFeed.waitForDeployment();
  // console.log(`MockPLS Price Feed deployed to: ${plsPriceFeed.target}`);

  console.log("\n--- Deploying Core Contracts ---");
  const LMKT = await ethers.getContractFactory("LMKT");
  const lmkt = await LMKT.deploy();
  await lmkt.waitForDeployment();
  console.log("LMKT deployed to:", lmkt.target);
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury deployed to:", treasury.target);
  const PriceOracleConsumerFactory = await ethers.getContractFactory("PriceOracleConsumer");
  const priceOracleConsumer = await PriceOracleConsumerFactory.deploy("0x0000000000000000000000000000000000000001");
  await priceOracleConsumer.waitForDeployment();
  console.log("PriceOracleConsumer deployed to:", priceOracleConsumer.target);
  const ListingManager = await ethers.getContractFactory("ListingManager");
  const listingManager = await ListingManager.deploy(treasury.target, lmkt.target, trustedSigner.address);
  await listingManager.waitForDeployment();
  console.log("ListingManager deployed to:", listingManager.target);
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(treasury.target, lmkt.target);
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor deployed to:", paymentProcessor.target);

  console.log("\n--- Performing Initial Setup ---");
  await treasury.setLmktAddress(lmkt.target);
  await treasury.setWhitelistedCollateral(mockDai.target, true);
  // await treasury.setWhitelistedCollateral(mockWeth.target, true);
  // await treasury.setWhitelistedCollateral(mockWbtc.target, true);
  // await treasury.setWhitelistedCollateral(mockPls.target, true);
  console.log("Whitelisted all collateral tokens in Treasury");
  await treasury.setPriceFeed(mockDai.target, daiPriceFeed.target);
  // await treasury.setPriceFeed(mockWeth.target, wethPriceFeed.target);
  // await treasury.setPriceFeed(mockWbtc.target, wbtcPriceFeed.target);
  // await treasury.setPriceFeed(mockPls.target, plsPriceFeed.target);
  console.log("Set all price feeds in Treasury");

  // const USDT_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("USDT/USD"));
  // const ETH_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("ETH/USD"));
  // const BTC_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("BTC/USD"));
  // const PLS_USD_QUERY_ID = ethers.keccak256(ethers.toUtf8Bytes("PLS/USD"));
  // await treasury.setTokenQueryId(mockDai.target, USDT_USD_QUERY_ID);
  // await treasury.setTokenQueryId(mockWeth.target, ETH_USD_QUERY_ID);
  // await treasury.setTokenQueryId(mockWbtc.target, BTC_USD_QUERY_ID);
  // await treasury.setTokenQueryId(mockPls.target, PLS_USD_QUERY_ID);
  // console.log("Set all token Query IDs in Treasury");

  // await priceOracleConsumer.fetchLatestPrice(USDT_USD_QUERY_ID);
  // await priceOracleConsumer.fetchLatestPrice(ETH_USD_QUERY_ID);
  // await priceOracleConsumer.fetchLatestPrice(BTC_USD_QUERY_ID);
  // await priceOracleConsumer.fetchLatestPrice(PLS_USD_QUERY_ID);
  // console.log("Initial prices fetched and stored in PriceOracleConsumer");
  console.log("Treasury setup complete.");

  console.log("\n--- Provisioning Initial Liquidity ---");
  await mockDai.mint(treasury.target, ethers.parseEther("25000"));
  // await mockWeth.mint(treasury.target, ethers.parseEther("25000"));
  // await mockPls.mint(treasury.target, ethers.parseEther("25000"));
  // await mockWbtc.mint(treasury.target, ethers.parseUnits("25000", 8));
  const initialSupply = await lmkt.totalSupply();
  await lmkt.transfer(treasury.target, initialSupply);
  await lmkt.transferOwnership(treasury.target);
  console.log("Initial liquidity provisioned.");

  console.log("\n--- Deploying Faucet ---");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(mockDai.target);
  // const faucet = await Faucet.deploy(mockDai.target, mockWeth.target, mockWbtc.target, mockPls.target);
  await faucet.waitForDeployment();
  console.log("Faucet deployed to:", faucet.target);
  await mockDai.addMinter(faucet.target);
  // await mockWeth.addMinter(faucet.target);
  // await mockWbtc.addMinter(faucet.target);
  // await mockPls.addMinter(faucet.target);
  await lbrty.addMinter(faucet.target);
  console.log("Faucet configured.");

  saveFrontendFiles({
    ListingManager: listingManager, Treasury: treasury, LMKT: lmkt,
    PaymentProcessor: paymentProcessor, Faucet: faucet, PriceOracleConsumer: priceOracleConsumer,
    MockDai: mockDai
    // MockDai: mockDai, MockWeth: mockWeth, MockWbtc: mockWbtc, MockPls: mockPls
  });

  console.log("\n✅ Deployment and configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});