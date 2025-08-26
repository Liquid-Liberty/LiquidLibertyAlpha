import React, { useState } from 'react';
import { useListings } from '../context/ListingsContext';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { listingManagerConfig, lmktConfig, paymentProcessorConfig } from '../contract-config';
import { formatEther, parseEther } from 'viem';

const ListingRow = ({ listing, escrow }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: deleteHash, writeContract: handleDeleteAction } = useWriteContract();
    const { isSuccess: isDelete, isError: isDeleteError, error: deleteError } = useWaitForTransactionReceipt({ hash: deleteHash });
    const { data: releaseHash, writeContract: handleReleaseAction } = useWriteContract();
    const { isSuccess: isReleased, isError: isReleaseError, error: releaseError } = useWaitForTransactionReceipt({ hash: releaseHash });
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleDelete = async (e) => {
        e.preventDefault();
        console.log("handleDelete called for listing:", listing.id);
        setIsLoading(true);
        setStatusMessage('Waiting Approval ...');
        handleDeleteAction({
            address: listingManagerConfig.address,
            abi: listingManagerConfig.abi,
            functionName: 'deleteListing',
            args: [listing.id],
        });
    };

    const handleRelease = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Releasing funds...');
        handleReleaseAction({
            address: paymentProcessorConfig.address,
            abi: paymentProcessorConfig.abi,
            functionName: 'releaseFunds',
            args: [escrow.listingId],
        });
    }

    const getStatusPill = (status) => {
        switch (status) {
            case 'active': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800">Active</span>;
            case 'escrow': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">In Escrow</span>;
            case 'dispute': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-200 text-red-800">In Dispute</span>;
            case 'completed': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-200 text-blue-800">Completed</span>;
            case 'expired': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-800">Expired</span>;
            default: return null;
        }
    };

    const getActionButtons = (status, escrow) => {
        switch (status) {
            case 'active': return <>
                {/* <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">Edit</button> */}
                <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600" onClick={handleDelete}>Delete</button>
            </>;
            case 'escrow': return <>
                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600" onClick={handleRelease}>Release Funds</button>
                {/* <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600">Start Dispute</button> */}
            </>;
            case 'dispute': return <>
                <button className="text-xs bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600">View Dispute</button>
            </>;
            case 'completed': return null;
            case 'expired': return <>
                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Repost</button>
                <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
            </>;
            default: return null;
        }
    };

    // Get the main image URL for the listing
    const getMainImageUrl = () => {
        if (listing.mainImage?.gatewayUrl) {
            return listing.mainImage.gatewayUrl;
        }
        if (listing.mainImage?.ipfsUrl) {
            return listing.mainImage.ipfsUrl;
        }
        if (listing.imageUrl) {
            return listing.imageUrl;
        }
        // Fallback to a placeholder image
        // return 'https://via.placeholder.com/48x48?text=No+Image';
    };

    // Determine listing status based on escrow and expiration
    const getListingStatus = () => {
        if (escrow && !escrow.fundsReleased) {
            return 'escrow';
        }
        if (listing.expiresAt && listing.expiresAt < Math.floor(Date.now() / 1000)) {
            return 'expired';
        }
        return 'active';
    };

    const status = getListingStatus();

    return (
        <div className="bg-stone-100 rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center min-w-0">
                    <img
                        src={getMainImageUrl()}
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                        }}
                    />
                    <div className="min-w-0">
                        <p className="font-bold text-zinc-800 truncate">{listing.title}</p>
                        <p className="text-sm text-zinc-600">${listing.price?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {getStatusPill(status)}
                    <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-200">
                    <div className="text-sm text-zinc-700 mt-3 space-y-1">
                        <p><strong>Date:</strong> {new Date(listing.createdAt || listing.uploadedAt || Date.now()).toLocaleDateString()}</p>
                        {escrow && <p><strong>Buyer:</strong> <code className="text-xs">{escrow.buyer}</code></p>}
                        {escrow && <p><strong>Escrow Amount:</strong> <code className="text-xs">{formatEther(escrow.totalAmount)}</code></p>}
                        <p><strong>Listing ID:</strong> {listing.id}</p>
                        <p><strong>Category:</strong> {listing.category || 'Uncategorized'}</p>
                        <p><strong>Delivery Method:</strong> {listing.deliveryMethod || 'Pickup'}</p>
                        {listing.description && <p><strong>Description:</strong> {listing.description}</p>}
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        {getActionButtons(status, escrow)}
                    </div>
                </div>
            )}
        </div>
    );
};

const EscrowRow = ({ escrow, listing }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get the main image URL for the listing
    const getMainImageUrl = () => {
        if (listing?.mainImage?.gatewayUrl) {
            return listing.mainImage.gatewayUrl;
        }
        if (listing?.mainImage?.ipfsUrl) {
            return listing.mainImage.ipfsUrl;
        }
        if (listing?.imageUrl) {
            return listing.imageUrl;
        }
        return 'https://via.placeholder.com/48x48?text=No+Image';
    };

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center min-w-0">
                    <img
                        src={getMainImageUrl()}
                        alt={listing?.title || 'Escrow'}
                        className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                        }}
                    />
                    <div className="min-w-0">
                        <p className="font-bold text-zinc-800 truncate">{listing?.title || `Escrow #${escrow.listingId}`}</p>
                        <p className="text-sm text-zinc-600">{formatEther(escrow.totalAmount)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">Escrow</span>
                    <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-yellow-200">
                    <div className="text-sm text-zinc-700 mt-3 space-y-1">
                        <p><strong>Listing ID:</strong> {escrow.listingId}</p>
                        <p><strong>Buyer:</strong> <code className="text-xs">{escrow.buyer}</code></p>
                        <p><strong>Seller:</strong> <code className="text-xs">{escrow.seller}</code></p>
                        <p><strong>Total Amount:</strong> {formatEther(escrow.totalAmount)}</p>
                        <p><strong>Funds Released:</strong> {escrow.fundsReleased ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        {!escrow.fundsReleased && (
                            <>
                                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Release Funds</button>
                                <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600">Start Dispute</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MyListings = () => {
    const { listings, escrows, loading, error, getUserListings, getUserEscrows } = useListings();
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

    // Get user's listings and escrows
    const userListings = getUserListings(address);
    const userEscrows = getUserEscrows(address);
    console.log("aria userListings = ", userListings)
    console.log("aria userEscrows = ", userEscrows)

    // Separate listings by status
    const activeListings = userListings.filter(l => {
        const escrow = escrows.find(e => e.listingId === l.id);
        return !escrow && l.expiresAt > Math.floor(Date.now() / 1000);
    });

    const escrowListings = userListings.filter(l => {
        const escrow = escrows.find(e => e.listingId === l.id);
        return escrow && !escrow.fundsReleased;
    });

    const completedListings = userListings.filter(l => {
        const escrow = escrows.find(e => e.listingId === l.id);
        return escrow && escrow.fundsReleased;
    });

    const expiredListings = userListings.filter(l => l.expiresAt < Math.floor(Date.now() / 1000));

    // Get escrows where user is buyer or seller
    const buyerEscrows = userEscrows.filter(e => e.buyer.toLowerCase() === address?.toLowerCase());
    const sellerEscrows = userEscrows.filter(e => e.seller.toLowerCase() === address?.toLowerCase());

    const listingSections = [
        { title: 'Active Listings', listings: activeListings, type: 'listings' },
        { title: 'In Escrow', listings: escrowListings, type: 'listings' },
        { title: 'Completed', listings: completedListings, type: 'listings' },
        { title: 'Expired', listings: expiredListings, type: 'listings' },
    ];

    const escrowSections = [
        { title: 'Buying (Escrow)', escrows: buyerEscrows, type: 'escrows' },
        { title: 'Selling (Escrow)', escrows: sellerEscrows, type: 'escrows' },
    ];

    return (
        <div className="space-y-8">
            {/* Listings Sections */}
            {listingSections.map(section => (
                section.listings.length > 0 && (
                    <div key={section.title}>
                        <h3 className="text-xl font-bold text-zinc-700 mb-3">{section.title} ({section.listings.length})</h3>
                        <div className="space-y-3">
                            {section.listings.map(listing => {
                                const escrow = escrows.find(e => e.listingId === listing.id);
                                return <ListingRow key={listing.id} listing={listing} escrow={escrow} />;
                            })}
                        </div>
                    </div>
                )
            ))}

            {/* Escrow Sections */}
            {escrowSections.map(section => (
                section.escrows.length > 0 && (
                    <div key={section.title}>
                        <h3 className="text-xl font-bold text-zinc-700 mb-3">{section.title} ({section.escrows.length})</h3>
                        <div className="space-y-3">
                            {section.escrows.map(escrow => {
                                const listing = listings.find(l => l.id === escrow.listingId);
                                return <EscrowRow key={`escrow-${escrow.listingId}`} escrow={escrow} listing={listing} />;
                            })}
                        </div>
                    </div>
                )
            ))}

            {/* No listings or escrows message */}
            {userListings.length === 0 && userEscrows.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-zinc-600">You don't have any listings or escrows yet.</p>
                    <p className="text-zinc-500 text-sm mt-2">Create your first listing to get started!</p>
                </div>
            )}
        </div>
    );
};

export default MyListings;