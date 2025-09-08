// src/context/ListingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useContractConfig } from "../hooks/useContractConfig";

const ListingsContext = createContext();
export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const [allListings, setAllListings] = useState([]);
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { address } = useAccount();
  const publicClient = usePublicClient();

  // ✅ new flattened return from your updated hook
  const { listingManagerConfig, loading: cfgLoading, networkName } = useContractConfig();

  const isExpired = (expirationTimestamp) => {
    const now = Math.floor(Date.now() / 1000);
    return Number(expirationTimestamp) <= now;
    // (<= so "now" counts as expired)
  };

  const toGateway = (uriOrCid) => {
    if (!uriOrCid || uriOrCid === "NO_METADATA") return null;
    if (uriOrCid.startsWith("ipfs://")) return `https://gateway.pinata.cloud/ipfs/${uriOrCid.slice(7)}`;
    // bare CID?
    if (/^[a-zA-Z0-9]{46,}$/.test(uriOrCid)) return `https://gateway.pinata.cloud/ipfs/${uriOrCid}`;
    return uriOrCid; // already https
  };

  const fetchIpfsJson = async (cidOrUrl) => {
    const url = toGateway(cidOrUrl);
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const readTotalListings = async () => {
    // Try common names in order
    const fns = ["listingCounter", "listingCount", "totalListings"];
    for (const fn of fns) {
      try {
        const n = await publicClient.readContract({
          address: listingManagerConfig.address,
          abi: listingManagerConfig.abi,
          functionName: fn,
        });
        if (typeof n === "bigint" || typeof n === "number") return Number(n);
      } catch {}
    }
    throw new Error("No listing count function found (tried listingCounter / listingCount / totalListings)");
  };

  const readListingById = async (id) => {
    // Try getListing(id), then listings(id)
    try {
      return await publicClient.readContract({
        address: listingManagerConfig.address,
        abi: listingManagerConfig.abi,
        functionName: "getListing",
        args: [BigInt(id)],
      });
    } catch {
      return await publicClient.readContract({
        address: listingManagerConfig.address,
        abi: listingManagerConfig.abi,
        functionName: "listings",
        args: [BigInt(id)],
      });
    }
  };

  const fetchListings = async () => {
    if (cfgLoading) return; // wait for config
    if (!publicClient || !listingManagerConfig?.address || !listingManagerConfig?.abi) {
      setAllListings([]);
      setMarketplaceListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Optional: sanity log (helps debug)
      // console.log("📡 Reading from", networkName, "@", listingManagerConfig.address);

      const total = await readTotalListings();
      if (!total) {
        setAllListings([]);
        setMarketplaceListings([]);
        return;
      }

      // Newest first: [total..1]
      const ids = Array.from({ length: total }, (_, i) => total - i);
      const rawListings = await Promise.all(ids.map(readListingById));

      const formatted = await Promise.all(
        rawListings.map(async (row, idx) => {
          // Tolerate field name variants and positional structs
          const owner = row.owner ?? row.seller ?? row.user ?? row[0];
          const price = row.priceInUsd ?? row.price ?? row.amount ?? row[1] ?? 0n;
          const type  = row.listingType ?? row.kind ?? row[2] ?? 0;
          const uri   = row.dataIdentifier ?? row.uri ?? row.metadata ?? row[3] ?? "NO_METADATA";
          const statusRaw = row.status ?? row[4] ?? 0;
          const exp   = row.expirationTimestamp ?? row.expiresAt ?? row[5] ?? 0;

          const meta = await fetchIpfsJson(String(uri));
          const firstGatewayImage =
            meta?.images?.[0]?.gatewayUrl ||
            (meta?.images?.[0]?.ipfsUrl ? toGateway(meta.images[0].ipfsUrl) : undefined) ||
            (meta?.imageUrl ? toGateway(meta.imageUrl) : undefined) ||
            (Array.isArray(meta?.photos) && meta.photos[0] ? toGateway(meta.photos[0]) : undefined) ||
            "/noImage.jpeg";

          const listingTypeMap = { 0: "ForSale", 1: "ServiceOffered" };
          const listingStatusMap = { 0: "Active", 1: "Inactive" };

          return {
            id: ids[idx], // the actual on-chain id (not index+1)
            owner,
            priceInUsd: Number(typeof price === "bigint" ? price : BigInt(price || 0)) / 1e8, // adjust if not 8 dp
            listingType: listingTypeMap[Number(type)] ?? "Unknown",
            status: listingStatusMap[Number(statusRaw)] ?? "Unknown",
            dataIdentifier: String(uri),
            expirationTimestamp: Number(exp),
            title: meta?.title || `Listing #${ids[idx]}`,
            description: meta?.description || "Details fetched from blockchain.",
            imageUrl: firstGatewayImage,
            category: meta?.category || null,
            serviceCategory: meta?.serviceCategory || null,
            rateType: meta?.rateType || null,
            zipCode: meta?.zipCode || null,
            deliveryMethod: meta?.deliveryMethod || null,
            shippingCost: meta?.shippingCost || null,
            raw: row,
          };
        })
      );

      setAllListings(formatted);
      setMarketplaceListings(
        formatted.filter((l) => l.status === "Active" && !isExpired(l.expirationTimestamp))
      );
    } catch (e) {
      console.error("Failed to fetch listings:", e);
      setError(e?.shortMessage || e?.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // Re-fetch when the user/account or contract address changes
  }, [address, publicClient, listingManagerConfig?.address, cfgLoading]);

  const value = {
    listings: marketplaceListings,
    allListings,
    loading,
    error,
    refreshListings: fetchListings,
    getUserListings: (userAddress) => {
      if (!userAddress) return [];
      return allListings.filter(
        (l) => (l.owner || "").toLowerCase() === userAddress.toLowerCase()
      );
    },
    isExpired,
  };

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
};
