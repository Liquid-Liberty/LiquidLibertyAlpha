import React from 'react';
import { useParams } from 'react-router-dom';
import { forSaleCategories } from '../data/categories';
import ItemListingCard from '../components/ItemListingCard';
import { useListings } from '../context/ListingsContext';

const ForSaleCategoryPage = () => {
    const { categoryName } = useParams();
    const category = forSaleCategories.find(c => c.key === categoryName);
    const { listings: blockchainListings, loading, error } = useListings();
    
    // Filter blockchain listings by category (for now, we'll show all ForSale listings)
    // In the future, you can add category information to the listing data
    const item_listings = blockchainListings.filter(l => l.listingType === 'ForSale' && (categoryName !== 'all' ? l.category === categoryName : true));

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">
                    {category ? category.name : 'For Sale'}
                </h1>
                
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-zinc-600">Loading listings from blockchain...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-600">Error: {error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {item_listings.length > 0 ? (
                            <>
                                <div className="mb-6 text-center">
                                    <p className="text-lg text-zinc-600">
                                        {item_listings.length} active listings found
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {item_listings.map(listing => (
                                        <ItemListingCard key={listing.id} listing={listing} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-zinc-600">There are no items listed in this category yet.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForSaleCategoryPage;