import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="container mx-auto px-6 py-12 text-center">
        <div className="bg-stone-50/95 p-8 md:p-16 rounded-lg shadow-lg inline-block">
            <h1 className="text-8xl font-display font-bold text-teal-800">404</h1>
            <h2 className="text-4xl font-display font-bold text-zinc-800 mt-4">Page Not Found</h2>
            <p className="text-zinc-600 mt-6">
                Sorry, the page you are looking for does not exist.
            </p>
            <Link to="/" className="mt-8 inline-block bg-teal-800 text-stone-100 py-3 px-8 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-lg">
                Go to Homepage
            </Link>
        </div>
    </div>
);

export default NotFoundPage;
