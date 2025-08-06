import React, { useState } from 'react';
import VendorSimulator from '../components/VendorSimulator'; // Import the simulator component

// The original form component, now extracted for clarity
const BecomeVendorForm = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted!");
        alert("Thank you for your interest! We will be in touch shortly.");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                <input type="text" id="name" name="name" required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
            </div>
            <div>
                <label htmlFor="business" className="block text-sm font-bold text-zinc-700 mb-2">Business Name (Optional)</label>
                <input type="text" id="business" name="business" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                <input type="email" id="email" name="email" required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-bold text-zinc-700 mb-2">Tell Us About Your Business</label>
                <textarea id="message" name="message" rows="4" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"></textarea>
            </div>
            <div className="text-center">
                <button type="submit" className="bg-teal-800 text-stone-100 py-3 px-8 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-lg">
                    Submit Inquiry
                </button>
            </div>
        </form>
    );
}

const VendorsPage = () => {
    const [activeTab, setActiveTab] = useState('simulate'); // Default to the simulator

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
                {/* Tab Navigation */}
                <div className="flex justify-center mb-8 border-b border-zinc-200">
                    <button 
                        onClick={() => setActiveTab('become')}
                        className={`px-6 py-3 font-bold text-lg transition ${activeTab === 'become' ? 'border-b-2 border-teal-800 text-teal-800' : 'text-zinc-500'}`}
                    >
                        Become a Vendor
                    </button>
                    <button 
                        onClick={() => setActiveTab('simulate')}
                        className={`px-6 py-3 font-bold text-lg transition ${activeTab === 'simulate' ? 'border-b-2 border-teal-800 text-teal-800' : 'text-zinc-500'}`}
                    >
                        Vendor Simulator
                    </button>
                </div>
                
                {/* Conditional Content */}
                {activeTab === 'become' && (
                    <div>
                        <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-2">
                            Support the Ecosystem
                        </h1>
                        <p className="text-center text-zinc-600 mb-8">
                            Leave your contact information below to start the process of getting payment processors set up for your business.
                        </p>
                        <BecomeVendorForm />
                    </div>
                )}

                {activeTab === 'simulate' && (
                    <VendorSimulator />
                )}
            </div>
        </div>
    );
};

export default VendorsPage;
