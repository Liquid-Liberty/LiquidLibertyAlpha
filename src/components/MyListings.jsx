import React, { useEffect, useState } from 'react';
import { useListings } from '../context/ListingsContext';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { listingManagerConfig } from '../config/contracts';

const ListingRow = ({ listing, onRefetch }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Close Listing
  const { data: closeHash, writeContract: handleCloseAction } = useWriteContract();
  const { isSuccess: isClosed } = useWaitForTransactionReceipt({ hash: closeHash });

  // Renew Listing
  const { data: renewHash, writeContract: handleRenewAction } = useWriteContract();
  const { isSuccess: isRenewed } = useWaitForTransactionReceipt({ hash: renewHash });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isClosed) {
      alert("Listing Closed");
      setIsLoading(false);
      setStatusMessage('');
      if (onRefetch) setTimeout(onRefetch, 2000);
    }
    if (isRenewed) {
      alert("Listing Renewed");
      setIsLoading(false);
      setStatusMessage('');
      if (onRefetch) setTimeout(onRefetch, 2000);
    }
  }, [isClosed, isRenewed, onRefetch]);

  const handleClose = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Closing listing...');
    handleCloseAction({
      address: listingManagerConfig.address,
      abi: listingManagerConfig.abi,
      functionName: 'closeListing',
      args: [listing.id],
    });
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Renewing listing...');
    handleRenewAction({
      address: listingManagerConfig.address,
      abi: listingManagerConfig.abi,
      functionName: 'renewListing',
      args: [listing.id],
    });
  };

  const isExpired = listing.expirationTimestamp
    ? listing.expirationTimestamp * 1000 < Date.now()
    : false;

  const getStatusPill = (status, expired) => {
    if (expired) {
      return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">Expired</span>;
    }
    switch (status) {
      case 'Active':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800">Active</span>;
      case 'Inactive':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-800">Inactive</span>;
      case 'Completed':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-200 text-blue-800">Completed</span>;
      default:
        return null;
    }
  };

  const getActionButtons = (status, expired) => {
    if (expired) {
      return (
        <button
          className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
          onClick={handleRenew}
        >
          Renew
        </button>
      );
    }
    switch (status) {
      case 'Active':
        return (
          <button
            className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
            onClick={handleClose}
          >
            Close
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-stone-100 rounded-lg">
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center min-w-0">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
            }}
          />
          <div className="min-w-0">
            <p className="font-bold text-zinc-800 truncate">{listing.title}</p>
            <p className="text-sm text-zinc-600">
              ${listing.priceInUsd?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          {getStatusPill(listing.status, isExpired)}
          <svg
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-200">
          <div className="text-sm text-zinc-700 mt-3 space-y-1">
            <p><strong>Listing ID:</strong> {listing.id}</p>
            {listing.description && (
              <p><strong>Description:</strong> {listing.description}</p>
            )}
            {listing.expirationTimestamp && (
              <p><strong>Expires:</strong> {new Date(listing.expirationTimestamp * 1000).toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-4">
            {getActionButtons(listing.status, isExpired)}
          </div>
        </div>
      )}
    </div>
  );
};

const MyListings = () => {
  const { loading, error, getUserListings, refreshListings } = useListings();
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-600">Please connect your wallet to view your listings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800 mx-auto"></div>
        <p className="text-zinc-600 mt-2">Loading your listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading listings: {error}</p>
      </div>
    );
  }

  const userListings = getUserListings(address);

  if (userListings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-600">You don't have any listings yet.</p>
        <p className="text-zinc-500 text-sm mt-2">Create your first listing to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userListings.map((listing) => (
        <ListingRow key={listing.id} listing={listing} onRefetch={refreshListings} />
      ))}
    </div>
  );
};

export default MyListings;
