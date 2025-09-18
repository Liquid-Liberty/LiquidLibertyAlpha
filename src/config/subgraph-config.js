// src/config/subquery-config.js - MIGRATED TO SECURE SYSTEM
// This file has been migrated to use the secure address assignment system
// The old insecure implementation has been replaced with validation and safety checks

import {
  useSecureSubqueryConfig as useSecureConfig,
  getSecureSubqueryConfig as getSecureConfig
} from "./secureSubgraphConfig.js";

// SECURE Hook version for React components
export function useSubqueryConfig() {
  try {
    const secureConfig = useSecureConfig();

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
  try {
    const secureConfig = getSecureConfig(chainId);

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


// REMOVED: Unsafe default export that could use wrong environment
// The old default export has been removed for security - always be explicit about chainId
