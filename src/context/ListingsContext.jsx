import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";

// Import contract configurations
import contractAddresses from "../config/contract-addresses.json";
import ListingManagerABI from "../config/ListingManager.json";

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  const publicClient = usePublicClient();

  // --- Helper: Fetch IPFS JSON ---
  const fetchIpfsJson = async (cidOrUrl) => {
    try {
      let url = cidOrUrl;
      if (cidOrUrl.startsWith("ipfs://")) {
        url = `https://ipfs.io/ipfs/${cidOrUrl.replace("ipfs://", "")}`;
      } else if (/^[a-zA-Z0-9]{46,}$/.test(cidOrUrl)) {
        url = `https://ipfs.io/ipfs/${cidOrUrl}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("IPFS fetch failed");
      return await res.json();
    } catch (e) {
      console.warn("Failed to fetch IPFS metadata for:", cidOrUrl, e);
      return null;
    }
  };

  // --- Helper: Expiration check ---
  const isExpired = (expirationTimestamp) => {
    return (
      expirationTimestamp &&
      Number(expirationTimestamp) < Math.floor(Date.now() / 1000)
    );
  };

  const fetchListings = async () => {
    const now = Date.now();

    if (!isConnected || !publicClient) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const totalListings = await publicClient.readContract({
        address: contractAddresses.ListingManager,
        abi: ListingManagerABI.abi,
        functionName: "listingCounter",
      });

      if (totalListings === 0n) {
        setListings([]);
        setLoading(false);
        return;
      }

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

      // Format + enrich with metadata
      const formattedListings = await Promise.all(
        rawListings.map(async (listing, index) => {
          const [
            owner,
            priceInUsd,
            listingType,
            status,
            dataIdentifier,
            expirationTimestamp,
          ] = listing;

          let metadata = null;
          if (dataIdentifier && dataIdentifier !== "NO_IMAGE") {
            metadata = await fetchIpfsJson(dataIdentifier);
          }

          return {
            id: index + 1,
            owner,
            priceInUsd: Number(priceInUsd) / 1e8,
            listingType:
              Number(listingType) === 0 ? "ForSale" : "ServiceOffered",
            status: Number(status) === 0 ? "Active" : "Inactive",
            dataIdentifier,
            expirationTimestamp: Number(expirationTimestamp),
            expired: isExpired(expirationTimestamp),
            title: metadata?.title || `Listing #${index + 1}`,
            description:
              metadata?.description || "Details fetched from blockchain.",
            imageUrl: metadata?.photos?.[0]
              ? `https://ipfs.io/ipfs/${metadata.photos[0]}`
              : "https://via.placeholder.com/150",
            category: metadata?.category || null,
            serviceCategory: metadata?.serviceCategory || null,
            rateType: metadata?.rateType || null,
            zipCode: metadata?.zipCode || null,
            deliveryMethod: metadata?.deliveryMethod || null,
            shippingCost: metadata?.shippingCost || null,
          };
        })
      );

      // ✅ Only show active, but pass along expired flag
      setListings(
        formattedListings.filter(
          (l) =>
            l.status === "Active" &&
            (!l.expirationTimestamp || l.expirationTimestamp * 1000 > now)
        )
      );
    } catch (e) {
      console.error("Failed to fetch listings:", e);
      setError("Failed to fetch listings from the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [isConnected, publicClient, address]);

  const value = {
    listings,
    loading,
    error,
    refreshListings: fetchListings,
    getUserListings: (userAddress) => {
      if (!userAddress) return [];
      return listings.filter(
        (l) => l.owner.toLowerCase() === userAddress.toLowerCase()
      );
    },
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
