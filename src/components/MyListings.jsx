import React, { useEffect, useState } from "react";
import { useListings } from "../context/ListingsContext";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useContractConfig } from "../hooks/useContractConfig";

const ListingRow = ({ listing, onRefetch, listingManagerConfig }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { data: closeHash, writeContract: handleCloseAction } = useWriteContract();
  const { data: deleteHash, writeContract: handleDeleteAction } = useWriteContract();
  const { data: renewHash, writeContract: handleRenewAction } = useWriteContract();

  const { isSuccess: isClosed } = useWaitForTransactionReceipt({ hash: closeHash });
  const { isSuccess: isDeleted } = useWaitForTransactionReceipt({ hash: deleteHash });
  const { isSuccess: isRenewed } = useWaitForTransactionReceipt({ hash: renewHash });

  const isExpired =
    listing.expirationTimestamp &&
    Number(listing.expirationTimestamp) * 1000 < Date.now();

  useEffect(() => {
    if (isClosed || isDeleted || isRenewed) {
      const msg =
        isClosed
          ? "Listing Closed"
          : isDeleted
          ? "Listing Deleted"
          : "Listing Renewed for 30 more days";

      alert(msg);
      setIsLoading(false);
      setStatusMessage("");
      if (onRefetch) setTimeout(onRefetch, 2000);
    }
  }, [isClosed, isDeleted, isRenewed, onRefetch]);

  const handleClose = (e) => {
    e.preventDefault();
    if (!listingManagerConfig) return;
    setIsLoading(true);
    setStatusMessage("Closing listing...");
    handleCloseAction({
      address: listingManagerConfig.address,
      abi: listingManagerConfig.abi,
      functionName: "closeListing",
      args: [listing.id],
    });
  };

  const handleDelete = (e) => {
    e.preventDefault();
    if (!listingManagerConfig) return;
    setIsLoading(true);
    setStatusMessage("Deleting listing...");
    handleDeleteAction({
      address: listingManagerConfig.address,
      abi: listingManagerConfig.abi,
      functionName: "deleteListing",
      args: [listing.id],
    });
  };

  const handleRenew = (e) => {
    e.preventDefault();
    if (!listingManagerConfig) return;
    setIsLoading(true);
    setStatusMessage("Renewing listing...");
    handleRenewAction({
      address: listingManagerConfig.address,
      abi: listingManagerConfig.abi,
      functionName: "renewListing",
      args: [listing.id],
    });
  };

  const getStatusPill = () => {
    if (isExpired) {
      return (
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-200 text-orange-800">
          Expired
        </span>
      );
    }
    switch (listing.status) {
      case "Active":
        return (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800">
            Active
          </span>
        );
      case "Inactive":
        return (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-800">
            Inactive
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-200 text-red-800">
            Unknown
          </span>
        );
    }
  };

  const getActionButtons = () => {
    if (isExpired) {
      return (
        <button
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
          onClick={handleRenew}
          disabled={isLoading}
        >
          Renew
        </button>
      );
    }

    switch (listing.status) {
      case "Active":
        return (
          <>
            <button
              className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              onClick={handleClose}
              disabled={isLoading}
            >
              Close
            </button>
            <button
              className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 ml-2"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </button>
          </>
        );
      case "Inactive":
        return (
          <button
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
            onClick={handleRenew}
            disabled={isLoading}
          >
            Renew
          </button>
        );
      default:
        return null;
    }
  };

  if (!listingManagerConfig?.address) return null;

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
              e.currentTarget.src = "/noImage.jpeg";
            }}
          />
          <div className="min-w-0">
            <p className="font-bold text-zinc-800 truncate">{listing.title}</p>
            <p className="text-sm text-zinc-600">
              ${listing.priceInUsd?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          {getStatusPill()}
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-200">
          <div className="text-sm text-zinc-700 mt-3 space-y-1">
            <p>
              <strong>Listing ID:</strong> {listing.id}
            </p>
            {listing.description && (
              <p>
                <strong>Description:</strong> {listing.description}
              </p>
            )}
            {listing.expirationTimestamp && (
              <p>
                <strong>Expires:</strong>{" "}
                {new Date(listing.expirationTimestamp * 1000).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-4">
            {getActionButtons()}
          </div>
          {isLoading && (
            <p className="text-xs text-zinc-500 mt-2">{statusMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

const MyListings = () => {
  const { loading, error, getUserListings, refreshListings } = useListings();
  const { address, isConnected } = useAccount();
  const { loading: cfgLoading, listingManagerConfig } = useContractConfig();

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-600">Please connect your wallet to view your listings</p>
      </div>
    );
  }

  if (loading || cfgLoading || !listingManagerConfig?.address) {
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
        <p className="text-zinc-500 text-sm mt-2">
          Create your first listing to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userListings.map((listing) => (
        <ListingRow
          key={listing.uniqueId}
          listing={listing}
          onRefetch={refreshListings}
          listingManagerConfig={listingManagerConfig}
        />
      ))}
    </div>
  );
};

export default MyListings;
