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
      // SAFETY: No unsafe defaults - throw error to force explicit network handling
      throw new Error(
        `Unsupported chain ID: ${chainId}. ` +
        `Supported chains: 11155111 (Sepolia), 943 (Pulse), 31337 (Local). ` +
        `Unsafe fallbacks have been removed to prevent wrong network configuration.`
      );
  }
}
