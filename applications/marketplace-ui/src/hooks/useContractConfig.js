// src/hooks/useContractConfig.js
import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import  {loadContractConfig}  from "../contract-config";

// Map chainId -> EXACT folder name in src/config/<name>/contract-addresses.json
const chainIdToName = {
  11155111: "sepolia",
  943: "pulse",
  31337: "localhost",
};

export function useContractConfig() {
  const chainId = useChainId();
  const networkName = useMemo(() => chainIdToName[chainId], [chainId]);

  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setConfigs(null);

      if (!networkName) {
        console.warn("No network mapping for chainId:", chainId);
        setLoading(false);
        return;
      }

      try {
        const cfg = await loadContractConfig(networkName);
        if (!cancelled) setConfigs(cfg);
      } catch (err) {
        console.error(`Failed to load contracts for ${networkName}`, err);
        if (!cancelled) setConfigs(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [networkName, chainId]);

  // Return spread configs so callers can do:
  // const { listingManagerConfig, mockDaiConfig } = useContractConfig();
  return {
    networkName,
    loading,
    ...(configs || {}),
  };
}
