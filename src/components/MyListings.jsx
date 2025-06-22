import React, { useState } from 'react';
import { userListings } from '../data/mockData'; // Import our new detailed listings

// --- Helper component for a single row ---
const ListingRow = ({ listing }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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

    const getActionButtons = (status) => {
        switch (status) {
            case 'active': return <>
                <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">Edit</button>
                <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
            </>;
            case 'escrow': return <>
                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Release Funds</button>
                <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600">Start Dispute</button>
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

    return (
        <div className="bg-stone-100 rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center min-w-0">
                    <img src={listing.photos[0].preview} alt={listing.title} className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-bold text-zinc-800 truncate">{listing.title}</p>
                        <p className="text-sm text-zinc-600">${listing.price.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {getStatusPill(listing.status)}
                    <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-200">
                    <div className="text-sm text-zinc-700 mt-3 space-y-1">
                        <p><strong>Date:</strong> {new Date(listing.date).toLocaleDateString()}</p>
                        {listing.buyerAddress && <p><strong>Buyer:</strong> <code className="text-xs">{listing.buyerAddress}</code></p>}
                        <p><strong>Listing ID:</strong> {listing.id}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        {getActionButtons(listing.status)}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
const MyListings = () => {
    // Categorize listings based on their status
    const activeListings = userListings.filter(l => l.status === 'active');
    const escrowListings = userListings.filter(l => l.status === 'escrow');
    const disputeListings = userListings.filter(l => l.status === 'dispute');
    const completedListings = userListings.filter(l => l.status === 'completed');
    const expiredListings = userListings.filter(l => l.status === 'expired');

    const listingSections = [
        { title: 'Active', listings: activeListings },
        { title: 'In Escrow', listings: escrowListings },
        { title: 'In Dispute', listings: disputeListings },
        { title: 'Completed', listings: completedListings },
        { title: 'Expired', listings: expiredListings },
    ];
    
    return (
        <div className="space-y-6">
            {listingSections.map(section => (
                section.listings.length > 0 && (
                    <div key={section.title}>
                        <h3 className="text-xl font-bold text-zinc-700 mb-3">{section.title} ({section.listings.length})</h3>
                        <div className="space-y-3">
                            {section.listings.map(listing => (
                                <ListingRow key={listing.id} listing={listing} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

export default MyListings;
