import React, { useState, useMemo } from 'react';
import ItemListingCard from '../components/ItemListingCard';
import AdBanner from '../components/AdBanner';
import { mockAds } from '../data/mockData';

const ForSalePage = ({ listings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deliveryFilter, setDeliveryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-desc');

    const item_listings = listings.filter(l => l.type === 'item');

    const filteredAndSortedListings = useMemo(() => {
        let filtered = item_listings.filter(listing =>
            listing.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (deliveryFilter !== 'all') {
            filtered = filtered.filter(listing => listing.deliveryMethod === deliveryFilter);
        }

        switch (sortOrder) {
            case 'price-asc':
                return [...filtered].sort((a, b) => a.price - b.price);
            case 'price-desc':
                return [...filtered].sort((a, b) => b.price - a.price);
            case 'date-desc':
            default:
                return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }, [item_listings, searchTerm, deliveryFilter, sortOrder]);

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">For Sale</h1>

                <AdBanner ad={mockAds.banner} />

                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                    <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition">
                        <option value="all">All Delivery Methods</option>
                        <option value="pickup">Pickup Only</option>
                        <option value="shipping">Shipping Available</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition">
                        <option value="date-desc">Sort by Newest</option>
                        <option value="price-asc">Sort by Price: Low to High</option>
                        <option value="price-desc">Sort by Price: High to Low</option>
                    </select>
                </div>
                {filteredAndSortedListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredAndSortedListings.map(listing => (
                            <ItemListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-zinc-600 py-10">No listings match your criteria.</p>
                )}
            </div>
        </div>
    );
};

export default ForSalePage;

