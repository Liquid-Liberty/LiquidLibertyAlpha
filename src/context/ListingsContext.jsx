import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

// Import contract configurations
import contractAddresses from '../config/contract-addresses.json';
import ListingManagerABI from '../config/ListingManager.json';

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  // wagmi's public client (configured for chain)
  const publicClient = usePublicClient();

  const fetchListings = async () => {
    if (!isConnected || !publicClient) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get the total number of listings
      const totalListings = await publicClient.readContract({
        address: contractAddresses.ListingManager,
        abi: ListingManagerABI.abi,
        functionName: 'listingCounter',
      });

      if (totalListings === 0n) {
        setListings([]);
        setLoading(false);
        return;
      }

      // 2. Loop through and fetch all listings
      const listingPromises = [];
      for (let i = 1; i <= Number(totalListings); i++) {
        listingPromises.push(
          publicClient.readContract({
            address: contractAddresses.ListingManager,
            abi: ListingManagerABI.abi,
            functionName: 'getListing',
            args: [BigInt(i)],
          })
        );
      }

      const rawListings = await Promise.all(listingPromises);

      // 3. Format struct data for UI
      const formattedListings = rawListings
        .map((listing, index) => {
          // Struct fields: [owner, priceInUsd, listingType, status, dataIdentifier]
          const [owner, priceInUsd, listingType, status, dataIdentifier] = listing;

          return {
            id: index + 1,
            owner,
            priceInUsd: Number(priceInUsd) / 1e8, // Convert from 8 decimals
            listingType: Number(listingType) === 0 ? 'ForSale' : 'ServiceOffered',
            status: Number(status) === 0 ? 'Active' : 'Inactive',
            dataIdentifier,
            // Placeholder UI metadata (real metadata can come from IPFS later)
            title: `Listing #${index + 1}`,
            description: 'Details fetched from blockchain.',
            imageUrl: 'https://via.placeholder.com/150',
          };
        })
        .filter(listing => listing.status === 'Active');

      setListings(formattedListings);

    } catch (e) {
      console.error("Failed to fetch listings:", e);
      setError('Failed to fetch listings from the blockchain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [isConnected, publicClient, address]);

  // Context value
 const value = {
    listings,
    loading,
    error,
    refreshListings: fetchListings,
    getUserListings: (userAddress) => {
      if (!userAddress) return [];
      return listings.filter(l => l.owner.toLowerCase() === userAddress.toLowerCase());
    }
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};