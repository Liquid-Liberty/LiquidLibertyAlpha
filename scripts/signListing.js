import { ethers } from "ethers";
import dotenv from "dotenv";
import ListingManagerABI from "../artifacts/contracts/ListingManager.sol/ListingManager.json";
import contractAddresses from "../frontend/src/config/contract-addresses.json";
import process from "process";

dotenv.config();

async function main() {
  let provider, trustedSigner, listingManagerAddress;

  switch (process.env.DEPLOY_ENV) {
    case "local":
      provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      trustedSigner = new ethers.Wallet(
        process.env.SIGNER_PRIVATE_KEY,
        provider
      );
      listingManagerAddress = contractAddresses.ListingManager;
      break;

    case "sepolia":
    default:
      provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      trustedSigner = new ethers.Wallet(
        process.env.SIGNER_PRIVATE_KEY,
        provider
      );
      listingManagerAddress = process.env.LISTING_MANAGER_ADDRESS;
      break;
  }

  // Example: sign typed data for a new listing
  const user = "0xYourTestUserAddress"; // replace with wallet you want to authorize
  const dataIdentifier = "ipfs://placeholder-cid"; //TODO: Implement IPFS upload
  const nonce = 1;
  const deadline =
    Math.floor(Date.now() / 1000) +
    parseInt(process.env.SIGNATURE_TTL_SECONDS || "3600");

  const domain = {
    name: "ListingManager",
    version: "1",
    chainId: (await provider.getNetwork()).chainId,
    verifyingContract: listingManagerAddress,
  };

  const types = {
    CreateListing: [
      { name: "user", type: "address" },
      { name: "dataIdentifier", type: "string" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const value = {
    user,
    dataIdentifier,
    nonce,
    deadline,
  };

  const signature = await trustedSigner.signTypedData(domain, types, value);

  console.log("Signature:", signature);
  console.log("Signed for user", user, "nonce", nonce, "deadline", deadline);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
