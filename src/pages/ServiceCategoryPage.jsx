import React from 'react';
import { useParams } from 'react-router-dom';
import { serviceCategories } from '../data/mockData';
import ServiceListingCard from '../components/ServiceListingCard';

const ServiceCategoryPage = ({ listings }) => {
    const { categoryName } = useParams();
    const category = serviceCategories.find(c => c.key === categoryName);
    const serviceListings = listings.filter(l => l.listingType === 'service' && (categoryName !== 'all' ? l.category === categoryName : true));

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">
                    {category ? category.name : 'Services'}
                </h1>
                {serviceListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {serviceListings.map(listing => (
                            <ServiceListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-zinc-600">There are no services listed in this category yet.</p>
                )}
            </div>
        </div>
    );
};

export default ServiceCategoryPage;
