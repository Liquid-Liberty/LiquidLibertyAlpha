import React from 'react';
import { useListings } from '../context/ListingsContext';

const ListingsDebug = () => {
  const { 
    listings, 
    escrows, 
    loading, 
    error, 
    refreshData,
    getUserListings,
    getUserEscrows 
  } = useListings();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-zinc-800 mb-6">ListingsContext Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Status</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Loading:</span> {loading ? '🔄 Yes' : '✅ No'}</p>
            <p><span className="font-medium">Error:</span> {error ? `❌ ${error}` : '✅ None'}</p>
            <p><span className="font-medium">Listings Count:</span> {listings.length}</p>
            <p><span className="font-medium">Escrows Count:</span> {escrows.length}</p>
          </div>
          <button 
            onClick={refreshData}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Listings Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Listings ({listings.length})</h3>
          {listings.length === 0 ? (
            <p className="text-gray-500 text-sm">No listings found</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {listings.slice(0, 5).map((listing) => (
                <div key={listing.id} className="bg-white p-2 rounded border text-xs">
                  <p><strong>ID:</strong> {listing.id}</p>
                  <p><strong>Type:</strong> {listing.listingType}</p>
                  <p><strong>Owner:</strong> {listing.owner.slice(0, 6)}...{listing.owner.slice(-4)}</p>
                  <p><strong>Data:</strong> {listing.dataIdentifier}</p>
                </div>
              ))}
              {listings.length > 5 && (
                <p className="text-gray-500 text-xs">... and {listings.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Escrows Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Escrows ({escrows.length})</h3>
          {escrows.length === 0 ? (
            <p className="text-gray-500 text-sm">No escrows found</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {escrows.slice(0, 5).map((escrow) => (
                <div key={escrow.listingId} className="bg-white p-2 rounded border text-xs">
                  <p><strong>Listing ID:</strong> {escrow.listingId}</p>
                  <p><strong>Amount:</strong> {escrow.totalAmount} LMKT</p>
                  <p><strong>Status:</strong> {escrow.fundsReleased ? 'Completed' : 'Pending'}</p>
                </div>
              ))}
              {escrows.length > 5 && (
                <p className="text-gray-500 text-xs">... and {escrows.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Contract Info Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Contract Info</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">ListingManager:</span></p>
            <p className="text-xs font-mono bg-gray-200 p-1 rounded">
              0x7b3A9fDcFDB6511E75a27Fc54c60d94E76d8Edd4
            </p>
            <p><span className="font-medium">PaymentProcessor:</span></p>
            <p className="text-xs font-mono bg-gray-200 p-1 rounded">
              0x4728eC4Faa2Fc91028Cf382899d445335a86Eca6
            </p>
          </div>
        </div>
      </div>

      {/* Raw Data (Collapsible) */}
      <details className="mt-6">
        <summary className="cursor-pointer text-lg font-semibold text-zinc-800">
          Raw Data (Click to expand)
        </summary>
        <div className="mt-3 bg-gray-100 p-4 rounded-lg">
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify({ listings, escrows, loading, error }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default ListingsDebug;

