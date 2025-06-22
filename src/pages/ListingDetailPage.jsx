import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { serviceCategories, mockAds } from '../data/mockData';
import AdSidebar from '../components/AdSidebar';

const ListingDetailPage = ({ listings }) => {
    const { id } = useParams();
    const listing = listings.find(l => l.id.toString() === id);
    const [mainImage, setMainImage] = useState(listing?.photos[0]?.preview || '');
    
    if (!listing) {
        return <div className="text-center py-20 font-display text-2xl">Listing not found.</div>;
    }
    
    const isService = listing.type === 'service';

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <div className="aspect-w-4 aspect-h-3 mb-4">
                                    <img src={mainImage} alt={listing.title} className="w-full h-full object-cover rounded-lg shadow-md"/>
                                </div>
                                {listing.photos.length > 1 && (
                                    <div className="flex space-x-2">
                                        {listing.photos.map((photo, index) => (
                                            <button key={index} onClick={() => setMainImage(photo.preview)} className={`w-20 h-20 rounded-md overflow-hidden border-2 ${mainImage === photo.preview ? 'border-teal-500' : 'border-transparent'}`}>
                                                <img src={photo.preview} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="font-display text-4xl font-bold text-zinc-900">{listing.title}</h1>
                                <p className="font-body text-4xl text-teal-800 my-4">
                                    ${listing.price.toFixed(2)}
                                    {isService && <span className="text-2xl text-zinc-600 ml-2">{listing.rateType}</span>}
                                </p>
                                <div className="space-y-4 text-zinc-700">
                                    <p className="whitespace-pre-wrap">{listing.description}</p>
                                    <hr />
                                    <p><span className="font-bold">Location:</span> Zip Code {listing.zipCode}</p>
                                    {!isService && (
                                        <p><span className="font-bold">Delivery:</span> {listing.deliveryMethod === 'pickup' ? 'In-Person Pickup' : `Shipping (${listing.shippingCost ? '$' + parseFloat(listing.shippingCost).toFixed(2) : 'N/A'})`}</p>
                                    )}
                                    {isService && (
                                        <p><span className="font-bold">Service Category:</span> {serviceCategories.find(c => c.key === listing.serviceCategory)?.name}</p>
                                    )}
                                </div>
                                <button className="w-full mt-8 bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg">
                                    {isService ? 'Contact Provider' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-4 hidden lg:block">
                        <div className="sticky top-24">
                            <h3 className="font-display text-xl font-bold mb-4 text-zinc-800">Sponsored</h3>
                            <AdSidebar ad={mockAds.sidebar} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailPage;
