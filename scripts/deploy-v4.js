import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("Starting Liberty Market Protocol v4 deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- 1. DEPLOY MOCK COLLATERAL & LBRTY TOKENS ---
  console.log("\n--- Deploying Mock Tokens ---");
  const GenericERC20 = await ethers.getContractFactory("GenericERC20");

  const mockDai = await GenericERC20.deploy("Mock DAI", "DAI", 18);
  await mockDai.waitForDeployment();
  console.log("MockDAI deployed to:", await mockDai.getAddress());

  const mockWeth = await GenericERC20.deploy("Mock WETH", "WETH", 18);
  await mockWeth.waitForDeployment();
  console.log("MockWETH deployed to:", await mockWeth.getAddress());

  const mockWbtc = await GenericERC20.deploy("Mock WBTC", "WBTC", 8);
  await mockWbtc.waitForDeployment();
  console.log("MockWBTC deployed to:", await mockWbtc.getAddress());

  const mockPls = await GenericERC20.deploy("Mock PLS", "PLS", 18);
  await mockPls.waitForDeployment();
  console.log("MockPLS deployed to:", await mockPls.getAddress());

  const lbrty = await GenericERC20.deploy("Liberty Access Token", "LBRTY", 18);
  await lbrty.waitForDeployment();
  console.log("LBRTY token deployed to:", await lbrty.getAddress());

  // --- 2. DEPLOY CORE PROTOCOL CONTRACTS ---
  console.log("\n--- Deploying Core Contracts ---");

  const LMKT = await ethers.getContractFactory("LMKT");
  const lmkt = await LMKT.deploy();
  await lmkt.waitForDeployment();
  console.log("LMKT deployed to:", await lmkt.getAddress());

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury deployed to:", await treasury.getAddress());

  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(await treasury.getAddress(), await lmkt.getAddress());
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor deployed to:", await paymentProcessor.getAddress());

  // --- 3. INITIAL SETUP & CONFIGURATION ---
  console.log("\n--- Performing Initial Setup ---");
  await treasury.setLmktAddress(await lmkt.getAddress());
  console.log("LMKT address set in Treasury");

  await treasury.setWhitelistedCollateral(await mockDai.getAddress(), true);
  await treasury.setWhitelistedCollateral(await mockWeth.getAddress(), true);
  await treasury.setWhitelistedCollateral(await mockWbtc.getAddress(), true);
  await treasury.setWhitelistedCollateral(await mockPls.getAddress(), true);
  console.log("Whitelisted all collateral tokens in Treasury");

  // Grant Payment Processor approval to send fees to Treasury
  await lmkt.connect(deployer).approve(await paymentProcessor.getAddress(), ethers.MaxUint256);
  // This approval needs to be on the PaymentProcessor instance itself after it receives funds.
  // The constructor of the PaymentProcessor now handles this.
  console.log("PaymentProcessor approval set.");


  // --- 4. INITIAL LIQUIDITY PROVISIONING (as per Protocol v4) ---
  console.log("\n--- Provisioning Initial Liquidity ---");

  const collateralAmount = ethers.parseEther("25000"); // $25,000
  const wbtcCollateralAmount = ethers.parseUnits("25000", 8); // $25,000 for WBTC

  // A) Fund the Treasury's collateral reserves ($100k total)
  await mockDai.mint(await treasury.getAddress(), collateralAmount);
  await mockWeth.mint(await treasury.getAddress(), collateralAmount);
  await mockPls.mint(await treasury.getAddress(), collateralAmount);
  await mockWbtc.mint(await treasury.getAddress(), wbtcCollateralAmount);
  console.log("Funded Treasury with $100,000 of mock collateral.");

  // B) Transfer 100T LMKT from deployer to the Treasury
  const treasuryLmktSupply = ethers.parseEther("100000000000000"); // 100 Trillion
  await lmkt.transfer(await treasury.getAddress(), treasuryLmktSupply);
  console.log("Transferred 100T LMKT to Treasury.");

  // C) Transfer LMKT ownership to the Treasury
  await lmkt.transferOwnership(await treasury.getAddress());
  console.log("Transferred LMKT ownership to Treasury.");

  // Note: The other 100T LMKT and $100k collateral for the DEX pool would be
  // handled by a separate entity/script interacting with a real DEX.
  // For this local deployment, we focus on setting up the Treasury correctly.

  // --- 5. DEPLOY & SETUP FAUCET ---
  console.log("\n--- Deploying Faucet ---");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(
    await mockDai.getAddress(),
    await mockWeth.getAddress(),
    await mockWbtc.getAddress(),
    await mockPls.getAddress()
  );
  await faucet.waitForDeployment();
  console.log("Faucet deployed to:", await faucet.getAddress());

  // Transfer ownership of mock tokens to the Faucet so it can mint
  await mockDai.transferOwnership(await faucet.getAddress());
  await mockWeth.transferOwnership(await faucet.getAddress());
  await mockWbtc.transferOwnership(await faucet.getAddress());
  await mockPls.transferOwnership(await faucet.getAddress());
  // We'll also have it own LBRTY for distribution
  await lbrty.transferOwnership(await faucet.getAddress());
  console.log("Transferred ownership of all mock tokens & LBRTY to Faucet.");

  console.log("\n✅ Deployment and setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
