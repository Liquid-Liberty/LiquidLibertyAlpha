// scripts/signListing.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import ListingManagerABI from "../artifacts/contracts/ListingManager.sol/ListingManager.json";
import process from "process";

dotenv.config();

export default async function signListing({
  user,
  dataIdentifier,
  nonce,
  deadline,
  chainId,
  verifyingContract,
}) {
  let provider, trustedSigner;

  switch (process.env.VITE_DEPLOY_ENV) {
    case "local":
      provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      trustedSigner = new ethers.Wallet(
        process.env.SIGNER_PRIVATE_KEY,
        provider
      );
      break;

    case "sepolia":
    default:
      provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      trustedSigner = new ethers.Wallet(
        process.env.SIGNER_PRIVATE_KEY,
        provider
      );
      break;
  }

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

  const value = { user, dataIdentifier, nonce, deadline };

  const signature = await trustedSigner.signTypedData(domain, types, value);

  return { signature, nonce, deadline, dataIdentifier };
}
