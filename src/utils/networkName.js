// src/utils/networkName.js
export function getNetworkNameFromChainId(chainId) {
  switch (chainId) {
    case 11155111: // Sepolia
      return "sepolia";
    case 943: // PulseChain Testnet
      return "pulse";
    case 31337: // Hardhat
      return "local";
    default:
      return "sepolia"; // fallback
  }
}
