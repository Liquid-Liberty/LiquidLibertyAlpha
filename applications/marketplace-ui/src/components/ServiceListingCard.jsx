import React from 'react';
import { Link } from 'react-router-dom';
import { formatCategoryTitle } from '../utils/formatters';

const ServiceListingCard = ({ listing }) => (
    <Link to={`/listing/${listing.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <img src={listing.imageUrl || 'https://placehold.co/600x400/eeeeee/333333?text=No+Image'} alt={listing.title} className="w-full h-48 object-cover" />
        <div className="p-4">
            <h3 className="font-display text-xl font-bold text-zinc-800 truncate">{listing.title}</h3>
            {listing.serviceCategory && (
                <p className="text-sm text-teal-600 font-medium mt-1">
                    {formatCategoryTitle(listing.serviceCategory)}
                </p>
            )}
            <p className="font-body text-2xl text-teal-800 mt-2">
                ${listing.priceInUsd?.toFixed(2) || '0.00'} <span className="text-lg text-zinc-600">{listing.rateType}</span>
            </p>
            <p className="text-sm text-zinc-500 mt-2">Location: {listing.zipCode}</p>
        </div>
    </Link>
);

export default ServiceListingCard;
