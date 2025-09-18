// src/utils/secureNetworkConfig.js - Secure network-based address assignment
import { getAddress, isAddress } from 'ethers';

/**
 * Secure network configuration with validation and safety checks
 */

// Hardcoded, immutable network configurations
const SECURE_NETWORK_CONFIG = Object.freeze({
  // Sepolia Testnet
  11155111: Object.freeze({
    name: "sepolia",
    chainId: 11155111,
    treasury: "0x7F77768fb73bA33606EB569966C109cD5CFe0F09",
    expectedRpcPattern: /sepolia/i,
    subqueryUrl: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
    isTestnet: true
  }),

  // PulseChain Testnet
  943: Object.freeze({
    name: "pulse",
    chainId: 943,
    treasury: "0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a",
    expectedRpcPattern: /pulse/i,
    subqueryUrl: "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart",
    isTestnet: true
  }),

  // Local Development
  31337: Object.freeze({
    name: "local",
    chainId: 31337,
    treasury: "0x0000000000000000000000000000000000000000",
    expectedRpcPattern: /localhost|127\.0\.0\.1/i,
    subqueryUrl: "http://localhost:3000",
    isTestnet: true
  })
});

// Supported chain IDs
const SUPPORTED_CHAIN_IDS = Object.freeze([11155111, 943, 31337]);

/**
 * Validates an Ethereum address
 */
function validateAddress(address, context = "address") {
  if (!address) {
    throw new Error(`${context} is required`);
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid ${context}: ${address}`);
  }

  try {
    // This will throw if checksum is invalid
    return getAddress(address);
  } catch (error) {
    throw new Error(`Invalid checksum for ${context}: ${address}`);
  }
}

/**
 * Validates chain ID
 */
function validateChainId(chainId) {
  if (!chainId) {
    throw new Error("Chain ID is required");
  }

  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`
    );
  }

  return chainId;
}

/**
 * Securely get network configuration by chain ID
 */
export function getSecureNetworkConfig(chainId) {
  // Validate chain ID first
  const validChainId = validateChainId(chainId);

  // Get immutable config
  const config = SECURE_NETWORK_CONFIG[validChainId];

  if (!config) {
    throw new Error(`No configuration found for chain ID: ${validChainId}`);
  }

  // Validate treasury address from config
  const validatedTreasury = validateAddress(config.treasury, "treasury address");

  // Return validated, immutable config
  return Object.freeze({
    ...config,
    treasury: validatedTreasury,
    pairAddress: validatedTreasury.toLowerCase() // For subquery compatibility
  });
}

/**
 * Get treasury address with full validation
 */
export function getSecureTreasuryAddress(chainId) {
  const config = getSecureNetworkConfig(chainId);
  return config.treasury;
}

/**
 * Get pair address for subquery (lowercase treasury)
 */
export function getSecurePairAddress(chainId) {
  const config = getSecureNetworkConfig(chainId);
  return config.pairAddress;
}

/**
 * Get subquery URL for chain
 */
export function getSecureSubqueryUrl(chainId) {
  const config = getSecureNetworkConfig(chainId);
  return config.subqueryUrl;
}

/**
 * Validate that we're on the expected network
 */
export function validateNetworkContext(chainId, rpcUrl = '') {
  const config = getSecureNetworkConfig(chainId);

  // Warn if RPC URL doesn't match expected pattern
  if (rpcUrl && !config.expectedRpcPattern.test(rpcUrl)) {
    console.warn(
      `⚠️ RPC URL "${rpcUrl}" doesn't match expected pattern for ${config.name} network`
    );
  }

  return config;
}

/**
 * Get all supported networks (for UI/debugging)
 */
export function getSupportedNetworks() {
  return SUPPORTED_CHAIN_IDS.map(chainId => getSecureNetworkConfig(chainId));
}

// Export constants for external use
export { SUPPORTED_CHAIN_IDS };