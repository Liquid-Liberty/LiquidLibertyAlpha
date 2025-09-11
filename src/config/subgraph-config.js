// src/config/subquery-config.js
import { loadContractConfig } from "../utils/loadContractConfig";
import { getNetworkNameFromChainId } from "../utils/networkName";
import { useChainId } from "wagmi";
import { useMemo } from "react";

// Hook version for React components
export function useSubqueryConfig() {
  const chainId = useChainId();
  const networkName = getNetworkNameFromChainId(chainId);
  const { treasuryConfig } = loadContractConfig(networkName);

  return useMemo(
    () => ({
      URL: "/.netlify/functions/subquery-proxy",
      PAIR_ADDRESS: treasuryConfig.address.toLowerCase(),
      DEFAULT_INTERVAL: "60",
      DEFAULT_CANDLE_LIMIT: 100,
    }),
    [treasuryConfig]
  );
}

// Non-hook version: resolves based on current .env *or* chainId
export function getStaticSubqueryConfig(chainId) {
  const networkName = getNetworkNameFromChainId(chainId);
  const { treasuryConfig } = loadContractConfig(networkName);

  return {
    URL: "/.netlify/functions/subquery-proxy",
    PAIR_ADDRESS: treasuryConfig.address.toLowerCase(),
    DEFAULT_INTERVAL: "60",
    DEFAULT_CANDLE_LIMIT: 100,
  };
}

// Default static export: falls back to env or Sepolia
export const SUBQUERY_CONFIG = getStaticSubqueryConfig(
  Number(import.meta.env.VITE_CHAIN_ID ?? 11155111) // 11155111 = Sepolia
);
