// This file contains the deployed contract addresses and their ABIs.
// This is the central point of configuration for the frontend to interact with the blockchain.

// --- Deployed Contract Addresses from the v4 deploy script ---
export const lbrtyAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
export const mockDaiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const mockWethAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const mockWbtcAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const mockPlsAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

export const lmktAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
export const treasuryAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
export const paymentProcessorAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const faucetAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";

// --- Contract ABIs (Application Binary Interfaces) ---

// ABI for PaymentProcessor.sol
export const paymentProcessorAbi = [
  "function makePurchase(uint256 listingId, uint256 price)",
  "function releaseFunds(uint256 listingId)"
];

// ABI for Treasury.sol
export const treasuryAbi = [
  "function buyMkt(uint256 collateralAmount, address collateralToken)",
  "function sellMkt(uint256 lmktAmount, address collateralToken)",
  "function getCollateralBackedPrice() view returns (uint256)"
];

// ABI for any ERC20 Token (LMKT, LBRTY, Mocks, etc.)
export const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// ABI for Faucet.sol
export const faucetAbi = [
  "function requestTokens()"
];
