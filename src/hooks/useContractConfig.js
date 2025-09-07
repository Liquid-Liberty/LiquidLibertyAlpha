// src/hooks/useContractConfig.js
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getContractConfigs } from "../contract-config";

const chainIdToName = {
  11155111: "sepolia",
  943: "pulse",
  31337: "localhost",
};

export function useContractConfig() {
  const { chain } = useAccount();
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkName, setNetworkName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setContracts(null);

      const id = chain?.id;
      if (!id) {
        setLoading(false);
        return;
      }

      const name = chainIdToName[id] || "sepolia";
      setNetworkName(name);

      try {
        const cfgs = await getContractConfigs(name);
        if (!cancelled) setContracts(cfgs);
      } catch (err) {
        console.error(`Failed to load contracts for ${name}`, err);
        if (!cancelled) setContracts(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [chain?.id]);

  return { contracts, networkName, loading };
}
