import { describe, it, beforeEach } from "mocha";
import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

Object.values({
  sepolia: { name: "sepolia" },
  pulse: { name: "pulse" },
}).forEach((net) => {
  describe(`Treasury Charting Events on ${net.name}`, function () {
    let treasury, owner, user, LMKT, MDAI, listingManager;

    beforeEach(async function () {
      [owner, user] = await ethers.getSigners();

      // Deploy mock LMKT and MDAI tokens
      const ERC20 = await ethers.getContractFactory("GenericERC20");
      LMKT = await ERC20.deploy("LMKT", "LMKT", 18);
      await LMKT.waitForDeployment();

      MDAI = await ERC20.deploy("MDAI", "MDAI", 18);
      await MDAI.waitForDeployment();

      // Deploy Treasury contract
      const TreasuryFactory = await ethers.getContractFactory("Treasury");
      treasury = await TreasuryFactory.deploy();
      await treasury.waitForDeployment();

      // Configure Treasury
      await treasury.setLmktAddress(await LMKT.getAddress());
      await LMKT.addMinter(await treasury.getAddress());
      await treasury.setWhitelistedCollateral(await MDAI.getAddress(), true);
      await treasury.setWhitelistedCollateral(await LMKT.getAddress(), true);

      // Deploy mock price oracle
      const Oracle = await ethers.getContractFactory("MockPriceOracle");
      const oracle = await Oracle.deploy();
      await oracle.waitForDeployment();

      //Mock price for DAI
      const queryId = ethers.encodeBytes32String("MaidAsStable");
      await oracle.setPrice(queryId, ethers.parseUnits("1", 8));
      await treasury.setPriceFeed(
        await MDAI.getAddress(),
        await oracle.getAddress()
      );
      await treasury.setTokenQueryId(await MDAI.getAddress(), queryId);

      //Mock price for LMKT
      const queryIdLMKT = ethers.encodeBytes32String("LMKTToken");
      await oracle.setPrice(queryIdLMKT, ethers.parseUnits("1", 8)); // $1.00
      await treasury.setPriceFeed(
        await LMKT.getAddress(),
        await oracle.getAddress()
      );
      await treasury.setTokenQueryId(await LMKT.getAddress(), queryIdLMKT);

      // Mint tokens to user
      await LMKT.mint(user.address, ethers.parseEther("1000"));
      await MDAI.mint(user.address, ethers.parseEther("1000"));

      // Deploy ListingManager with owner as trusted signer
      const ListingManager = await ethers.getContractFactory("ListingManager");
      listingManager = await ListingManager.deploy(
        await treasury.getAddress(),
        await LMKT.getAddress(),
        owner.address
      );
      await listingManager.waitForDeployment();
    });

    it("should emit MKTSwap event and allow chart handler to process", async function () {
      await MDAI.connect(user).approve(
        await treasury.getAddress(),
        ethers.parseEther("100")
      );

      const tx = await treasury
        .connect(user)
        .buyMkt(ethers.parseEther("100"), await MDAI.getAddress(), 0);
      const receipt = await tx.wait();

      // Parse logs
      const TreasuryFactory = await ethers.getContractFactory("Treasury");
      const parsedLogs = receipt.logs
        .map((log) => {
          try {
            return TreasuryFactory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const swapEvent = parsedLogs.find((e) => e.name === "MKTSwap");
      expect(swapEvent, "MKTSwap event not found").to.exist;
      expect(swapEvent.args.collateralAmount).to.equal(
        ethers.parseEther("100")
      );
    });

    it("should emit ListingCreated event and allow chart handler to process (with signature verification)", async function () {
      await LMKT.connect(owner).mint(user.address, ethers.parseEther("10"));
      await LMKT.connect(user).approve(
        await listingManager.getAddress(),
        ethers.parseEther("10")
      );

      const dataIdentifier = "Test Listing";
      const nonce = 0;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // EIP-712 domain
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const verifyingContract = await listingManager.getAddress();
      const domain = {
        name: "ListingManager",
        version: "1",
        chainId,
        verifyingContract,
      };

      const types = {
        CreateListing: [
          { name: "user", type: "address" },
          { name: "dataIdentifier", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        user: user.address,
        dataIdentifier,
        nonce,
        deadline,
      };

      const signature = await owner.signTypedData(domain, types, message);

      const tx = await listingManager.connect(user).createListing(
        0, // ListingType.ForSale
        ethers.parseEther("10"),
        dataIdentifier,
        nonce,
        deadline,
        signature
      );
      const receipt = await tx.wait();

      const ListingManagerFactory = await ethers.getContractFactory(
        "ListingManager"
      );
      const parsedLogs = receipt.logs
        .map((log) => {
          try {
            return ListingManagerFactory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const event = parsedLogs.find((e) => e.name === "ListingCreated");
      expect(event, "ListingCreated event not found").to.exist;
      expect(event.args.feePaid).to.equal(ethers.parseUnits("5"));
    });
  });
});
