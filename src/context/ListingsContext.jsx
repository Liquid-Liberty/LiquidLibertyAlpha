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
  
  // Use wagmi's public client, which is already configured for our local node
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

      // 1. Get the total number of listings directly from the contract
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
      
      const listingPromises = [];
      // 2. Loop from 1 to totalListings to fetch each one
      for (let i = 1; i <= totalListings; i++) {
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
      
      // 3. Format the data for the UI
      const formattedListings = rawListings
        .map((listing, index) => {
          // The contract returns a struct as an array-like object.
          // Let's map it to a clean JS object based on our new struct.
          const [owner, priceInUsd, listingType, status, dataIdentifier] = listing;
          return {
            id: index + 1,
            owner,
            priceInUsd: Number(priceInUsd) / (10 ** 8), // Convert from 8 decimals
            listingType: Number(listingType) === 0 ? 'ForSale' : 'ServiceOffered',
            status: Number(status) === 0 ? 'Active' : 'Inactive',
            dataIdentifier,
            // We can add IPFS data fetching here later if needed
            title: `Listing #${index + 1}`,
            description: 'Details fetched from blockchain.',
            imageUrl: 'https://via.placeholder.com/150', // Placeholder image
          };
        })
        .filter(listing => listing.status === 'Active'); // Only show active listings

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

  // The value provided by the context
  const value = {
    listings,
    loading,
    error,
    refreshListings: fetchListings, // Function to allow other components to trigger a refresh
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