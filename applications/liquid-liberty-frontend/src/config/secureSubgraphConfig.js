// src/config/secureSubgraphConfig.js - Secure subgraph configuration
import { useChainId } from "wagmi";
import { useMemo } from "react";
import {
  getSecureNetworkConfig,
  getSecurePairAddress,
  getSecureSubqueryUrl,
  validateNetworkContext
} from "../utils/secureNetworkConfig.js";

/**
 * Secure hook for subquery configuration
 * Replaces the old useSubqueryConfig with security validations
 */
export function useSecureSubqueryConfig() {
  const chainId = useChainId();

  return useMemo(() => {
    try {
      // Validate and get secure configuration
      const networkConfig = getSecureNetworkConfig(chainId);
      const pairAddress = getSecurePairAddress(chainId);
      const subqueryUrl = getSecureSubqueryUrl(chainId);

      // Additional network context validation
      validateNetworkContext(chainId);


      return Object.freeze({
        URL: "/.netlify/functions/subquery-proxy", // Always use proxy
        PAIR_ADDRESS: pairAddress,
        TREASURY_ADDRESS: networkConfig.treasury,
        CHAIN_ID: networkConfig.chainId,
        NETWORK_NAME: networkConfig.name,
        SUBQUERY_ENDPOINT: subqueryUrl,
        DEFAULT_INTERVAL: "60",
        DEFAULT_CANDLE_LIMIT: 100,
        IS_TESTNET: networkConfig.isTestnet
      });
    } catch (error) {
      console.error('🚨 Secure subquery config error:', error.message);

      // Don't fail silently - throw the error to prevent wrong data
      throw new Error(
        `Failed to get secure subquery configuration: ${error.message}`
      );
    }
  }, [chainId]);
}

/**
 * Non-hook version for static usage
 */
export function getSecureSubqueryConfig(chainId) {
  try {
    const networkConfig = getSecureNetworkConfig(chainId);
    const pairAddress = getSecurePairAddress(chainId);
    const subqueryUrl = getSecureSubqueryUrl(chainId);

    return Object.freeze({
      URL: "/.netlify/functions/subquery-proxy",
      PAIR_ADDRESS: pairAddress,
      TREASURY_ADDRESS: networkConfig.treasury,
      CHAIN_ID: networkConfig.chainId,
      NETWORK_NAME: networkConfig.name,
      SUBQUERY_ENDPOINT: subqueryUrl,
      DEFAULT_INTERVAL: "60",
      DEFAULT_CANDLE_LIMIT: 100,
      IS_TESTNET: networkConfig.isTestnet
    });
  } catch (error) {
    console.error('🚨 Static secure subquery config error:', error.message);
    throw error;
  }
}

/**
 * Validate configuration before use
 */
export function validateSubqueryConfig(config) {
  const required = ['PAIR_ADDRESS', 'TREASURY_ADDRESS', 'CHAIN_ID', 'NETWORK_NAME'];

  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required subquery config field: ${field}`);
    }
  }

  return true;
}