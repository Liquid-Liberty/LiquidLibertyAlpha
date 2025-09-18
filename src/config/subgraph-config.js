// src/config/subquery-config.js - MIGRATED TO SECURE SYSTEM
// This file has been migrated to use the secure address assignment system
// The old insecure implementation has been replaced with validation and safety checks

import {
  useSecureSubqueryConfig as useSecureConfig,
  getSecureSubqueryConfig as getSecureConfig
} from "./secureSubgraphConfig.js";

// SECURE Hook version for React components
export function useSubqueryConfig() {
  console.log("🔒 Using SECURE subquery configuration");

  try {
    const secureConfig = useSecureConfig();

    // Log secure configuration for debugging
    console.log("🔒 Secure config loaded:", {
      network: secureConfig.NETWORK_NAME,
      chainId: secureConfig.CHAIN_ID,
      pairAddress: secureConfig.PAIR_ADDRESS,
      treasury: secureConfig.TREASURY_ADDRESS
    });

    // Return in the same format as before for backward compatibility
    return {
      URL: secureConfig.URL,
      PAIR_ADDRESS: secureConfig.PAIR_ADDRESS,
      DEFAULT_INTERVAL: secureConfig.DEFAULT_INTERVAL,
      DEFAULT_CANDLE_LIMIT: secureConfig.DEFAULT_CANDLE_LIMIT,
      // Additional secure fields
      TREASURY_ADDRESS: secureConfig.TREASURY_ADDRESS,
      CHAIN_ID: secureConfig.CHAIN_ID,
      NETWORK_NAME: secureConfig.NETWORK_NAME,
      IS_TESTNET: secureConfig.IS_TESTNET
    };
  } catch (error) {
    console.error("🚨 SECURE CONFIG ERROR:", error.message);

    // Don't silently fall back - this is a security feature!
    throw new Error(`Secure subquery configuration failed: ${error.message}`);
  }
}

// SECURE Non-hook version: resolves based on chainId with validation
export function getStaticSubqueryConfig(chainId) {
  console.log(`🔒 Getting SECURE static config for chain ${chainId}`);

  try {
    const secureConfig = getSecureConfig(chainId);

    console.log("🔒 Secure static config loaded:", {
      network: secureConfig.NETWORK_NAME,
      chainId: secureConfig.CHAIN_ID,
      pairAddress: secureConfig.PAIR_ADDRESS
    });

    // Return in the same format as before for backward compatibility
    return {
      URL: secureConfig.URL,
      PAIR_ADDRESS: secureConfig.PAIR_ADDRESS,
      DEFAULT_INTERVAL: secureConfig.DEFAULT_INTERVAL,
      DEFAULT_CANDLE_LIMIT: secureConfig.DEFAULT_CANDLE_LIMIT,
      // Additional secure fields
      TREASURY_ADDRESS: secureConfig.TREASURY_ADDRESS,
      CHAIN_ID: secureConfig.CHAIN_ID,
      NETWORK_NAME: secureConfig.NETWORK_NAME,
      IS_TESTNET: secureConfig.IS_TESTNET
    };
  } catch (error) {
    console.error(`🚨 SECURE STATIC CONFIG ERROR for chain ${chainId}:`, error.message);

    // Don't silently fall back - this is a security feature!
    throw new Error(`Secure static subquery configuration failed: ${error.message}`);
  }
}

// Backward compatibility exports
export { useSecureSubqueryConfig, getSecureSubqueryConfig } from "./secureSubgraphConfig.js";

// Legacy warning for deprecated patterns
console.warn("⚠️ subgraph-config.js has been migrated to secure system. Consider using secureSubgraphConfig.js directly.");

// REMOVED: Unsafe default export that could use wrong environment
// The old default export has been removed for security - always be explicit about chainId
