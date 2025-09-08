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

  // flattened return from your updated hook
  const { listingManagerConfig, loading: cfgLoading } = useContractConfig();

  // ---------- Gateway helpers ----------
  const GATEWAY =
    import.meta.env.VITE_PINATA_GATEWAY?.replace(/\/+$/, "") ||
    "https://cloudflare-ipfs.com";

  // If ipfs://CID => CID; if https URL => leave as-is; else return as given (CID/path)
  const toCid = (v) => {
    if (!v || typeof v !== "string") return null;
    if (v.startsWith("ipfs://")) return v.slice(7);
    return v;
  };

  // Convert anything IPFS-like to an https URL on our preferred gateway
  const ipfsToHttp = (v) => {
    if (!v || typeof v !== "string") return null;
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    if (v.startsWith("ipfs://")) return `${GATEWAY}/ipfs/${v.slice(7)}`;
    // treat any other string as a CID/path
    return `${GATEWAY}/ipfs/${v}`;
  };

  const fetchIpfsJson = async (cidOrUrl) => {
    if (!cidOrUrl) return null;

    if (
      typeof cidOrUrl === "string" &&
      (cidOrUrl.startsWith("http://") || cidOrUrl.startsWith("https://"))
    ) {
      try {
        const r = await fetch(cidOrUrl, { cache: "no-store" });
        if (r.ok) return await r.json();
      } catch {
        /* ignore and return null below */
      }
      return null;
    }

    const cid = toCid(cidOrUrl);
    if (!cid || cid === "NO_METADATA") return null;

    const candidates = [
      `${GATEWAY}/ipfs/${cid}`, // dedicated gateway (preferred)
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch {
        // try next
      }
    }
    return null;
  };

  // ---------- Misc helpers ----------
  const isExpired = (expirationTimestamp) => {
    const now = Math.floor(Date.now() / 1000);
    return Number(expirationTimestamp) <= now;
  };

  const readTotalListings = async () => {
    const fns = ["listingCounter", "listingCount", "totalListings"];
    for (const fn of fns) {
      try {
        const n = await publicClient.readContract({
          address: listingManagerConfig.address,
          abi: listingManagerConfig.abi,
          functionName: fn,
        });
        if (typeof n === "bigint" || typeof n === "number") return Number(n);
      } catch {
        /* try next */
      }
    }
    throw new Error(
      "No listing count function found (tried listingCounter / listingCount / totalListings)"
    );
  };

  const readListingById = async (id) => {
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
    if (cfgLoading) return;

    if (
      !publicClient ||
      !listingManagerConfig?.address ||
      !listingManagerConfig?.abi
    ) {
      setAllListings([]);
      setMarketplaceListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
          // tolerate field name variants and positional structs
          const owner = row.owner ?? row.seller ?? row.user ?? row[0];
          const priceRaw =
            row.priceInUsd ?? row.price ?? row.amount ?? row[1] ?? 0n;
          const type = row.listingType ?? row.kind ?? row[2] ?? 0;
          const uri =
            row.dataIdentifier ?? row.uri ?? row.metadata ?? row[3] ?? "NO_METADATA";
          const statusRaw = row.status ?? row[4] ?? 0;
          const exp = row.expirationTimestamp ?? row.expiresAt ?? row[5] ?? 0;

          const meta = await fetchIpfsJson(String(uri));

          const firstGatewayImage =
            meta?.images?.[0]?.gatewayUrl ||
            (meta?.images?.[0]?.ipfsUrl
              ? ipfsToHttp(meta.images[0].ipfsUrl)
              : undefined) ||
            (meta?.imageUrl ? ipfsToHttp(meta.imageUrl) : undefined) ||
            (Array.isArray(meta?.photos) && meta.photos[0]
              ? ipfsToHttp(meta.photos[0])
              : undefined) ||
            "/noImage.jpeg";

          const listingTypeMap = { 0: "ForSale", 1: "ServiceOffered" };
          const listingStatusMap = { 0: "Active", 1: "Inactive" };

          // priceInUsd expects 8 decimals per your contract
          const priceBig =
            typeof priceRaw === "bigint" ? priceRaw : BigInt(priceRaw || 0);

          return {
            id: ids[idx],
            owner,
            priceInUsd: Number(priceBig) / 1e8,
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
        formatted.filter(
          (l) => l.status === "Active" && !isExpired(l.expirationTimestamp)
        )
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
  // expose helper if you need it elsewhere
    isExpired,
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
