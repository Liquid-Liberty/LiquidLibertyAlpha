import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";

// Import contract configurations
import contractAddresses from "../config/contract-addresses.json";
import ListingManagerABI from "../config/ListingManager.json";

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const [allListings, setAllListings] = useState([]); // raw unfiltered
  const [marketplaceListings, setMarketplaceListings] = useState([]); // active + unexpired
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  const publicClient = usePublicClient();

  // --- Helper: Expiration check ---
  const isExpired = (expirationTimestamp) => {
    const now = Math.floor(Date.now() / 1000);
    return Number(expirationTimestamp) <= now;
  };

  // --- Helper: Fetch IPFS JSON ---
  const fetchIpfsJson = async (cidOrUrl) => {
    try {
      let url = cidOrUrl;
      if (!cidOrUrl) {
        console.log(`No cidOrURL provided to fetchIpfsJson`);
        return null;
      }
      if (cidOrUrl.startsWith("ipfs://")) {
        url = `https://ipfs.io/ipfs/${cidOrUrl.replace("ipfs://", "")}`;
      } else if (/^[a-zA-Z0-9]{46,}$/.test(cidOrUrl)) {
        url = `https://ipfs.io/ipfs/${cidOrUrl}`;
      }
      console.log("🔎 Fetching metadata from:", cidOrUrl, "→", url);
      
      const res = await fetch(url);
      if (!res.ok) {
      console.error("❌ IPFS fetch failed:", res.status, res.statusText);
      return null;
    }

    const json = await res.json();
    console.log("✅ Metadata fetched:", json);
    return json;
  } catch (e) {
      console.warn("Failed to fetch IPFS metadata for:", cidOrUrl, e);
      return null;
    }
  };

  // --- Core Fetch ---
  const fetchListings = async () => {
    if (!isConnected || !publicClient) {
      setAllListings([]);
      setMarketplaceListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

     // --- Network guard ---
const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV;

// pick expected chainId
const expectedChainId = DEPLOY_ENV === "sepolia" ? 11155111 : 31337;

const chainId = await publicClient.getChainId();
if (chainId !== expectedChainId) {
  setError(
    `Wrong network: please connect to ${DEPLOY_ENV === "sepolia" ? "Sepolia Testnet" : "Hardhat localhost"}.`
  );
  setLoading(false);
  return;
}

      // Get total listings
      const totalListings = await publicClient.readContract({
        address: contractAddresses.ListingManager,
        abi: ListingManagerABI.abi,
        functionName: "listingCounter",
      });

      if (totalListings === 0n) {
        setAllListings([]);
        setMarketplaceListings([]);
        setLoading(false);
        return;
      }

      // Fetch each listing
      const listingPromises = [];
      for (let i = 1; i <= Number(totalListings); i++) {
        listingPromises.push(
          publicClient.readContract({
            address: contractAddresses.ListingManager,
            abi: ListingManagerABI.abi,
            functionName: "getListing",
            args: [BigInt(i)],
          })
        );
      }

      const rawListings = await Promise.all(listingPromises);

      // Format + enrich

      const formattedListings = await Promise.all(
        rawListings.map(async (listing, index) => {
          // ✅ Use object destructuring, not array
          const {
            owner,
            priceInUsd,
            listingType,
            status,
            dataIdentifier,
            expirationTimestamp,
          } = listing;

          let metadata = null;
          console.log("🔎 Fetching metadata from:", dataIdentifier);
          // Always try to fetch metadata JSON, even if no image was uploaded
          if (dataIdentifier && dataIdentifier !== "NO_METADATA") {
            try {
              metadata = await fetchIpfsJson(dataIdentifier);
            } catch (e) {
              console.warn(
                "Failed to fetch listing metadata:",
                dataIdentifier,
                e
              );
            }
          }

          const listingTypeMap = { 0: "ForSale", 1: "ServiceOffered" };
          const listingStatusMap = {
            0: "Active",
            1: "Inactive",
          };

          console.log("📋 Raw Listing", {
            id: index + 1,
            owner,
            priceInUsd: Number(priceInUsd) / 1e8,
            listingType: listingTypeMap[Number(listingType)],
            status: listingStatusMap[Number(status)],
            expirationTimestamp: Number(expirationTimestamp),
          });

          return {
            id: index + 1,
            owner,
            priceInUsd: Number(priceInUsd) / 1e8,
            listingType: listingTypeMap[Number(listingType)] ?? "Unknown",
            status: listingStatusMap[Number(status)] ?? "Unknown",
            dataIdentifier,
            expirationTimestamp: Number(expirationTimestamp),
            title: metadata?.title || `Listing #${index + 1}`,
            description:
              metadata?.description || "Details fetched from blockchain.",
            imageUrl: metadata?.photos?.[0]
              ? `https://ipfs.io/ipfs/${metadata.photos[0]}`
              : "/noImage.jpeg",
            category: metadata?.category || null,
            serviceCategory: metadata?.serviceCategory || null,
            rateType: metadata?.rateType || null,
            zipCode: metadata?.zipCode || null,
            deliveryMethod: metadata?.deliveryMethod || null,
            shippingCost: metadata?.shippingCost || null,
          };
        })
      );

      setAllListings(formattedListings);
      setMarketplaceListings(
        formattedListings.filter(
          (l) => l.status === "Active" && !isExpired(l.expirationTimestamp)
        )
      );
    } catch (e) {
      console.error("Failed to fetch listings from ListingManager:", e);
      setError(`Failed to fetch listings: ${e.shortMessage || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [isConnected, publicClient, address]);

  const value = {
    listings: marketplaceListings,
    allListings,
    loading,
    error,
    refreshListings: fetchListings,
    getUserListings: (userAddress) => {
      if (!userAddress) return [];
      return allListings.filter(
        (l) => l.owner.toLowerCase() === userAddress.toLowerCase()
      );
    },
    isExpired,
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
