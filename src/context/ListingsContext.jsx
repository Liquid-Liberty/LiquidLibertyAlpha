import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseAbiItem, decodeEventLog, createPublicClient, http, encodeFunctionData, decodeFunctionResult } from 'viem';

// Contract addresses
import contractAddresses from '../config/contract-addresses.json';
import ListingManagerABI from '../config/ListingManager.json';
import PaymentProcessorABI from '../config/PaymentProcessor.json';

const ListingsContext = createContext();

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  // Since _listingCounter is private, we'll use a different approach
  // We'll try to fetch listings sequentially and stop when we find an invalid one

  // Fetch all listings from ListingManager
  const fetchListings = async () => {
    // Don't fetch if not connected
    if (!isConnected) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a direct RPC client instead of relying on getPublicClient
      // Define RPC endpoints
      const rpcEndpoints = [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://eth-sepolia.g.alchemy.com/v2/demo'
      ];

      let publicClient = null;
      let chainId = 11155111; // Sepolia
      let chainName = 'direct-rpc-sepolia';

      // Try to create a public client with each RPC endpoint
      for (const rpcUrl of rpcEndpoints) {
        try {
          console.log(`Trying RPC endpoint: ${rpcUrl}`);

          publicClient = createPublicClient({
            chain: {
              id: 11155111,
              name: 'Sepolia Testnet',
              nativeCurrency: { name: 'tETH', symbol: 'tETH', decimals: 18 },
              rpcUrls: { default: { http: [rpcUrl] } },
              blockExplorers: { default: { name: 'Sepolia Scan', url: 'https://sepolia.etherscan.io/' } },
              testnet: true,
            },
            transport: http(rpcUrl),
          });

          // Test the client by making a simple call
          try {
            await publicClient.getBlockNumber();
            break;
          } catch (testError) {
            publicClient = null;
            continue;
          }
        } catch (error) {
          continue;
        }
      }

      if (!publicClient) {
        console.error('All RPC endpoints failed');
        setError('Failed to connect to any Sepolia RPC endpoint');
        return;
      }

      const allListings = [];

      // Validate contract address
      if (!contractAddresses.listingManager || contractAddresses.listingManager === '0x0000000000000000000000000000000000000000') {
        setError('Invalid contract address for ListingManager');
        return;
      }

      // Validate ABI
      if (!ListingManagerABI?.abi || ListingManagerABI.abi.length === 0) {
        setError('Invalid ABI for ListingManager');
        return;
      }

      // Try to fetch listings sequentially until we find an invalid one
      // We'll limit this to a reasonable number to avoid infinite loops
      const maxAttempts = 10;

      for (let i = 1; i <= maxAttempts; i++) {
        try {
          const listing = await publicClient.readContract({
            address: contractAddresses.listingManager,
            abi: ListingManagerABI.abi,
            functionName: 'listings',
            args: [BigInt(i)],
          });

          // Check if listing is valid (not expired and owner is not zero address)
          if (listing[0] !== '0x0000000000000000000000000000000000000000' &&
            listing[1] > BigInt(Math.floor(Date.now() / 1000))) {

            // Fetch IPFS data if dataIdentifier exists
            let ipfsData = null;
            if (listing[3] && listing[3] !== '') {
              try {
                // Convert IPFS hash to gateway URL
                const ipfsHash = listing[3].replace('ipfs://', '');

                // Try multiple IPFS gateways for reliability
                const gateways = [
                  `https://ipfs.io/ipfs/${ipfsHash}`,
                ];

                // Try each gateway until one works
                for (const gatewayUrl of gateways) {
                  try {

                    const response = await fetch(gatewayUrl, {
                      method: 'GET',
                      headers: {
                        'Accept': 'application/json',
                      },
                      // Add timeout
                      signal: AbortSignal.timeout(10000) // 10 second timeout
                    });

                    if (response.ok) {
                      ipfsData = await response.json();
                      break; // Success, exit the loop
                    } else {
                    }
                  } catch (gatewayError) {
                    continue; // Try next gateway
                  }
                }

                if (!ipfsData) {
                }
              } catch (ipfsError) {
              }
            }

            // Create the listing object with parsed data
            const listingData = {
              id: i,
              owner: listing[0],
              expiresAt: Number(listing[1]),
              listingType: listing[2] === 0n ? 'ForSale' : 'ServiceOffered',
              dataIdentifier: listing[3],
              isValid: true,
              // IPFS data fields
              title: ipfsData?.title || 'Untitled',
              description: ipfsData?.description || 'No description',
              listingType: ipfsData?.listingType || 'item',
              userAddress: ipfsData?.userAddress || listing.owner,
              category: ipfsData?.category || 'uncategorized',
              price: ipfsData?.price || 0,
              zipCode: ipfsData?.zipCode || '',
              deliveryMethod: ipfsData?.deliveryMethod || 'pickup',
              createdAt: ipfsData?.createdAt || new Date().toISOString(),
              uploadedAt: ipfsData?.uploadedAt || new Date().toISOString(),
              totalImages: ipfsData?.totalImages || 0,
              // Process images to get the main image URL
              imageUrl: ipfsData?.images?.[0]?.ipfsHash || null,
              // Get the main image details
              mainImage: ipfsData?.images?.[0] ? {
                originalName: ipfsData.images[0].originalName,
                ipfsHash: ipfsData.images[0].ipfsHash,
                ipfsUrl: ipfsData.images[0].ipfsUrl,
                gatewayUrl: ipfsData.images[0].gatewayUrl,
                size: ipfsData.images[0].size,
                isMock: ipfsData.images[0].isMock
              } : null,
              // Store full IPFS data for reference
              ipfsData: ipfsData
            };

            allListings.push(listingData);
          } else if (listing.owner === '0x0000000000000000000000000000000000000000') {
            // Found an empty slot, we can stop here
            break;
          }
        } catch (error) {
          // If we get an error, we've likely reached the end of valid listings
          break;
        }
      }

      setListings(allListings);
    } catch (error) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all escrows from PaymentProcessor
  const fetchEscrows = async () => {
    // Don't fetch if not connected
    if (!isConnected) {
      return;
    }

    try {
      setError(null);

      // Define RPC endpoints
      const rpcEndpoints = [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://eth-sepolia.g.alchemy.com/v2/demo'
      ];

      let publicClient = null;
      let chainId = 11155111; // Sepolia
      let chainName = 'direct-rpc-sepolia';

      // Try to create a public client with each RPC endpoint
      for (const rpcUrl of rpcEndpoints) {
        try {
          publicClient = createPublicClient({
            chain: {
              id: 11155111,
              name: 'Sepolia Testnet',
              nativeCurrency: { name: 'tETH', symbol: 'tETH', decimals: 18 },
              rpcUrls: { default: { http: [rpcUrl] } },
              blockExplorers: { default: { name: 'Sepolia Scan', url: 'https://sepolia.etherscan.io/' } },
              testnet: true,
            },
            transport: http(rpcUrl),
          });

          // Test the client by making a simple call
          try {
            await publicClient.getBlockNumber();
            console.log(`✅ Successfully created RPC client with: ${rpcUrl}`);
            break;
          } catch (testError) {
            console.log(`❌ RPC endpoint failed test: ${rpcUrl} - ${testError.message}`);
            publicClient = null;
            continue;
          }
        } catch (error) {
          console.log(`❌ Failed to create RPC client with: ${rpcUrl} - ${error.message}`);
          continue;
        }
      }

      if (!publicClient) {
        console.error('All RPC endpoints failed');
        setError('Failed to connect to any Sepolia RPC endpoint');
        return;
      }

      console.log(`✅ Using direct RPC client for ${chainName} (chain ID: ${chainId})`);

      const allEscrows = [];

      // Get all PurchaseMade events to find escrows
      const fromBlock = 8990580n;
      const toBlock = 'latest';

      try {
        const logs = await publicClient.getLogs({
          address: contractAddresses.paymentProcessor,
          event: parseAbiItem('event PurchaseMade(uint256 indexed listingId, address indexed buyer, uint256 totalAmount)'),
          fromBlock,
          toBlock,
        });

        // Process each purchase event to get escrow details
        for (const log of logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: PaymentProcessorABI.abi,
              data: log.data,
              topics: log.topics,
            });

            const { listingId, buyer, totalAmount } = decodedLog.args;

            // Get the escrow details
            const escrow = await publicClient.readContract({
              address: contractAddresses.paymentProcessor,
              abi: PaymentProcessorABI.abi,
              functionName: 'escrows',
              args: [listingId],
            });
            console.log(`Escrow for listing ${listingId}:`, escrow);

            if (escrow.buyer !== '0x0000000000000000000000000000000000000000') {
              allEscrows.push({
                listingId: Number(listingId),
                buyer: escrow[0],
                seller: escrow[1],
                totalAmount: Number(escrow[2]),
                fundsReleased: escrow[3],
                purchaseAmount: Number(totalAmount),
              });
            }
          } catch (error) {
            console.log(`Error processing escrow for listing ${log.args?.listingId}:`, error.message);
          }
        }
      } catch (error) {
        console.log('No purchase events found or error getting logs:', error.message);
      }
      console.log(`Found ${allEscrows.length} escrows`);

      setEscrows(allEscrows);
    } catch (error) {
      console.error('Error fetching escrows:', error);
      setError('Failed to fetch escrows');
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    await Promise.all([fetchListings(), fetchEscrows()]);
  };

  // Refresh data
  const refreshData = () => {
    fetchAllData();
  };

  // Get listings by type
  const getListingsByType = (type) => {
    return listings.filter(listing => listing.listingType === type);
  };

  // Get escrows by listing ID
  const getEscrowByListingId = (listingId) => {
    return escrows.find(escrow => escrow.listingId === listingId);
  };

  // Get user's listings
  const getUserListings = (userAddress) => {
    return listings.filter(listing => listing.owner.toLowerCase() === userAddress?.toLowerCase());
  };

  // Get user's escrows (as buyer or seller)
  const getUserEscrows = (userAddress) => {
    if (!userAddress) return [];
    return escrows.filter(escrow =>
      escrow.buyer === userAddress ||
      escrow.seller === userAddress
    );
  };

  // Get all images for a listing
  const getListingImages = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing?.ipfsData?.images) return [];

    return listing.ipfsData.images.map(img => ({
      originalName: img.originalName,
      ipfsHash: img.ipfsHash,
      ipfsUrl: img.ipfsUrl,
      gatewayUrl: img.gatewayUrl,
      size: img.size,
      isMock: img.isMock
    }));
  };

  // Get listings by category
  const getListingsByCategory = (category) => {
    return listings.filter(listing => listing.category === category);
  };

  // Get listings by price range
  const getListingsByPriceRange = (minPrice, maxPrice) => {
    return listings.filter(listing =>
      listing.price >= minPrice && listing.price <= maxPrice
    );
  };

  // Get listings by delivery method
  const getListingsByDeliveryMethod = (deliveryMethod) => {
    return listings.filter(listing => listing.deliveryMethod === deliveryMethod);
  };

  // Get main image URL for a listing
  const getListingMainImage = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    return listing?.mainImage?.ipfsUrl || listing?.imageUrl || null;
  };

  // Get all image URLs for a listing
  const getListingAllImageUrls = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing?.ipfsData?.images) return [];

    return listing.ipfsData.images.map(img => img.ipfsUrl).filter(Boolean);
  };

  // Initial data fetch
  useEffect(() => {
    if (isConnected) {
      // Add a small delay to ensure wagmi is fully initialized
      const timer = setTimeout(() => {
        console.log('Wagmi connection status:', { isConnected, address });
        console.log('Attempting to fetch data...');

        // Check if we're on the right network
        if (window.ethereum) {
          window.ethereum.request({ method: 'eth_chainId' })
            .then((chainId) => {
              console.log('Current chain ID:', chainId);
              console.log('Expected chain ID (Sepolia):', '0xaa36a7'); // 11155111 in hex
              if (chainId !== '0xaa36a7') {
                console.warn('Warning: You are not connected to Sepolia testnet');
                setError('Please connect to Sepolia testnet to view listings');
                return;
              }
              fetchAllData();
            })
            .catch((error) => {
              console.error('Error getting chain ID:', error);
              fetchAllData(); // Try anyway
            });
        } else {
          fetchAllData();
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      console.log('Wallet not connected, skipping data fetch');
    }
  }, [isConnected, address]);

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 300000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const value = {
    listings,
    escrows,
    loading,
    error,
    refreshData,
    getListingsByType,
    getEscrowByListingId,
    getUserListings,
    getUserEscrows,
    getListingImages,
    getListingsByCategory,
    getListingsByPriceRange,
    getListingsByDeliveryMethod,
    getListingMainImage,
    getListingAllImageUrls,
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
