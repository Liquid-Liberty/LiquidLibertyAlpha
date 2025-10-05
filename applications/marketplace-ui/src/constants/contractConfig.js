// 🚨 DEPRECATED: This file is no longer used for address management
//
// Contract addresses are now managed dynamically through:
// - Network-specific JSON files: src/config/{network}/contract-addresses.json
// - Secure network config: src/utils/secureNetworkConfig.js
// - Address sync utility: scripts/sync-addresses.js
//
// To get current contract addresses, use the appropriate hooks or utilities
// that read from the network-specific configuration files.
//
// This file is kept for reference but should not be imported or used.

// 💀 REMOVED: Hardcoded addresses (now managed dynamically per network)
// These addresses were local development addresses and are no longer valid:
// - lbrtyAddress, mockDaiAddress, mockWethAddress, mockWbtcAddress, mockPlsAddress
// - lmktAddress, treasuryAddress, paymentProcessorAddress, faucetAddress

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
  "function decimals() view returns (uint8)",
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
