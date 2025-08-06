import React from 'react';
import { Link } from 'react-router-dom';
import { forSaleCategories } from '../data/categories';
import AdBanner from '../components/AdBanner';
import { mockAds } from '../data/mockData';

const ForSalePage = () => {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">For Sale</h1>

                <AdBanner ad={mockAds.banner} />

                <h2 className="text-2xl font-bold text-zinc-800 mb-6 text-center">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {forSaleCategories.map((cat) => (
                        <Link
                            key={cat.key}
                            to={`/for-sale/${cat.key}`}
                            className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-teal-50 transition-all duration-300 text-center"
                        >
                            <span className="font-bold font-body text-zinc-800">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ForSalePage;