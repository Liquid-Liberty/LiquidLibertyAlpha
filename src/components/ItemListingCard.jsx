import React from 'react';
import { Link } from 'react-router-dom';

const ItemListingCard = ({ listing }) => (
    <Link to={`/listing/${listing.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <img src={`https://ipfs.io/ipfs/${listing.imageUrl}` || 'https://placehold.co/600x400/eeeeee/333333?text=No+Image'} alt={listing.title} className="w-full h-48 object-cover" />
        <div className="p-4">
            <h3 className="font-display text-xl font-bold text-zinc-800 truncate">{listing.title}</h3>
            <p className="font-body text-2xl text-teal-800 mt-2">${listing.price.toFixed(2)}</p>
            <p className="text-sm text-zinc-500 mt-2">Location: {listing.zipCode}</p>
        </div>
    </Link>
);

export default ItemListingCard;
