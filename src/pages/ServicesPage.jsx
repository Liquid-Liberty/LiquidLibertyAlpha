import React from 'react';
import { Link } from 'react-router-dom';
import { serviceCategories } from '../data/categories';

const ServicesPage = () => {
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">Browse Services</h1>
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
            </div>
        </div>
    );
};

export default ServicesPage;