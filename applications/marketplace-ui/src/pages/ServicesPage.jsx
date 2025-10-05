import React from 'react';
import { Link } from 'react-router-dom';
import { serviceCategories } from '../data/categories';
import { useListings } from '../context/ListingsContext';
import { localAds } from '../data/ads';
import AdBanner from '../components/AdBanner';


const ServicesPage = () => {
    const { listings, loading, error } = useListings();
    const serviceListings = listings.filter(listing => listing.listingType === 'ServiceOffered');
      //Marketing
      const adKey = 'shillBanner'
      const selectedAd = localAds[adKey];
      const adImages = import.meta.glob('../assets/marketing/*', { eager: true, as: 'url' });
      const matchedImage = Object.entries(adImages).find(([path]) =>
          path.endsWith(selectedAd.imagePath)
      );
      const resolvedAd = {
          ...selectedAd,
          imageUrl: matchedImage?.[1] || '',
      }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">Browse Services</h1>

                <AdBanner ad={resolvedAd} />
                
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-2 text-zinc-600">Loading services from blockchain...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-600">Error: {error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="mb-8 text-center">
                            <p className="text-lg text-zinc-600">
                                {serviceListings.length} active service listings found
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {serviceCategories.map((cat) => (
                                <Link
                                    key={cat.key}
                                    to={`/services/${cat.key}`}
                                    className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-teal-50 transition-all duration-300 text-center"
                                >
                                    <span className="font-bold font-body text-zinc-800">{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ServicesPage;