import React from 'react';
import { useParams } from 'react-router-dom';
import { forSaleCategories } from '../data/categories';
import ItemListingCard from '../components/ItemListingCard';

const ForSaleCategoryPage = ({ listings }) => {
    const { categoryName } = useParams();
    const category = forSaleCategories.find(c => c.key === categoryName);
    
    const item_listings = listings.filter(l => {
        if (l.type !== 'item') return false;
        if (categoryName === 'all') return true;
        return l.category === categoryName;
    });

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">
                    {category ? category.name : 'For Sale'}
                </h1>
                {item_listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {item_listings.map(listing => (
                            <ItemListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-zinc-600">There are no items listed in this category yet.</p>
                )}
            </div>
        </div>
    );
};

export default ForSaleCategoryPage;