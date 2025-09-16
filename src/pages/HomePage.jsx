import React, { useState, useEffect } from 'react';
import { useListings } from '../context/ListingsContext';
import ItemListingCard from '../components/ItemListingCard';

// --- HERO COMPONENT (No changes) ---
const Hero = () => (
    <div className="relative py-32 md:py-48">
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-4">
            <h1 className="text-5xl md:text-7xl font-display font-bold drop-shadow-lg">
                Welcome to Liberty Market
            </h1>
            <p className="text-lg md:text-xl mt-4 font-body italic text-stone-300">
                Where crypto becomes what it was born to be
            </p>
        </div>
    </div>
);

// --- CONTENT SECTION (No changes) ---
const Content = () => (
    <div className="container mx-auto px-6 pb-16">
        <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
            <h2 className="text-4xl font-display font-bold text-zinc-900 mb-4">
                What is Liberty Market?
            </h2>
            <p className="text-zinc-700 leading-loose">
                Liberty Market is a decentralized ecosystem designed to fundamentally re-platform commerce by creating a self-sustaining, circular economy. It addresses the core problems of high merchant fees in traditional finance and the speculative, non-commercial nature of most crypto assets. By integrating a digital marketplace, a real-world payment network, and a novel on-chain protocol, The Market creates a flywheel of value where protocol revenue and user participation perpetually strengthen the ecosystem. Its core pillars are a unique collateralized mint-and-burn token model (MKT), a reputation-based social contract that disincentivizes capital flight, and a robust, tiered dispute resolution system that ensures transactional integrity in a fully anonymous environment.
            </p>
        </div>
    </div>
);

// --- DISCLAIMER MODAL (UPDATED FOR SIZE) ---
const DisclaimerModal = ({ onAccept }) => (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
        <div className="bg-stone-800 text-stone-200 p-8 rounded-lg shadow-2xl max-w-3xl border border-stone-600">
            <h2 className="text-3xl font-bold mb-4">Welcome to The Market (Alpha)</h2>
            <div className="text-base space-y-4 max-h-96 overflow-y-auto pr-4">
                <p className="font-bold text-yellow-400 text-lg">
                    This is experimental alpha software. Use a test wallet with no real funds. The creators are not responsible for any lost funds.
                </p>
                <p>
                    By proceeding, you agree to the End-User License Agreement (EULA) that will be presented next and acknowledge that the software is provided "AS IS" without warranty.
                </p>
                <h3 className="text-xl font-bold mt-4">Zero Tolerance for Illegal Activity</h3>
                <p>
                    This protocol is for lawful commerce only. Any attempt to use this dApp for illegal activities (sale of stolen goods, illicit substances, etc.) is unequivocally prohibited. We will cooperate fully with law enforcement to ensure any individual attempting to conduct illegal activities is prosecuted to the maximum extent of the law.
                </p>
            </div>
            <button
                onClick={onAccept}
                className="mt-6 w-full bg-teal-800 text-white py-3 rounded-md hover:bg-teal-900 transition font-bold"
            >
                I Understand, Continue to EULA
            </button>
        </div>
    </div>
);

// --- EULA MODAL (NEW) ---
const EulaModal = ({ onAccept }) => (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
        <div className="bg-stone-800 text-stone-200 p-8 rounded-lg shadow-2xl max-w-4xl w-full border border-stone-600 flex flex-col h-[90vh]">
            <h2 className="text-3xl font-bold mb-4 flex-shrink-0">End-User License Agreement (EULA)</h2>
            <div className="text-sm space-y-4 overflow-y-auto pr-4 flex-grow">
                <p>This Agreement is between "You" (the Licensee) and the creators of "Liberty Market" (the Licensor). By using this software, you agree to these terms.</p>
                
                <h3 className="text-lg font-bold">1. Grant of License</h3>
                [cite_start]<p>You are granted a non-exclusive, non-transferable license to use the Liberty Market software solely for your own purposes, subject to the terms of this Agreement. [cite: 6, 14, 15] [cite_start]You may not reverse engineer, decompile, or disassemble the software. [cite: 26] [cite_start]You shall not permit any third party to use or have access to the software. [cite: 25]</p>

                <h3 className="text-lg font-bold">2. Intellectual Property</h3>
                [cite_start]<p>You acknowledge that the Licensor retains all right, title, and interest in the Software. [cite: 31] [cite_start]The software constitutes proprietary information and trade secrets of the Licensor. [cite: 32] [cite_start]You agree to maintain all information in the software in strict confidence. [cite: 33]</p>

                <h3 className="text-lg font-bold">3. Warranties & Limitation of Liability</h3>
                [cite_start]<p>THE SOFTWARE IS PROVIDED "AS IS". [cite: 65] [cite_start]THE LICENSOR EXCLUDES ALL IMPLIED WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR ANY PURPOSE. [cite: 66, 67] [cite_start]You assume the entire risk related to the use of the Software. [cite: 70] [cite_start]The Licensor shall not be liable for any consequential, incidental, or special damages, including lost profits or lost savings. [cite: 72]</p>

                <h3 className="text-lg font-bold">4. Term and Termination</h3>
                [cite_start]<p>The license is perpetual unless terminated. [cite: 47] [cite_start]This Agreement will terminate immediately if you breach your obligations. [cite: 48] [cite_start]Upon termination, you must discontinue all use of the software and destroy all copies. [cite: 50, 52]</p>

                <h3 className="text-lg font-bold">5. Dispute Resolution</h3>
                [cite_start]<p>Any claim or dispute arising out of this Agreement shall be arbitrated in the State of New York. [cite: 87]</p>

                <h3 className="text-lg font-bold">6. Governing Law</h3>
                [cite_start]<p>This Agreement shall be governed by the internal laws of the State of Texas. [cite: 119]</p>
            </div>
            <button
                onClick={onAccept}
                className="mt-6 w-full bg-teal-800 text-white py-3 rounded-md hover:bg-teal-900 transition font-bold flex-shrink-0"
            >
                I Have Read and Agree to the EULA
            </button>
        </div>
    </div>
);

// --- LISTINGS SECTION (No changes) ---
const ListingsSection = ({ listings, loading, error }) => {
    if (loading) {
        return <div className="text-center text-white py-16"><p className="animate-pulse">Loading listings...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-400 py-16"><p>Error: {error}</p></div>;
    }
    if (listings.length === 0) {
        return <div className="text-center text-stone-400 py-16"><p>No active listings found.</p></div>;
    }
    const forSaleListings = listings.filter(l => l.listingType === 'ForSale');
    return (
        <div className="container mx-auto px-6 pb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-8 text-center">Latest Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {forSaleListings.map(listing => (
                    <ItemListingCard key={listing.uniqueId} listing={listing} />
                ))}
            </div>
        </div>
    );
};

// --- FINAL HOMEPAGE (UPDATED WITH NEW LOGIC) ---
const HomePage = () => {
    const { listings, loading, error } = useListings();
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    useEffect(() => {
        // 👇 Log all sessionStorage items when HomePage mounts
        console.log("📦 HomePage loaded. Current sessionStorage:");
        if (sessionStorage.length === 0) {
            console.log("⚠️ sessionStorage is empty");
        } else {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                console.log(`${key}: ${sessionStorage.getItem(key)}`);
            }
        }

        // Check if disclaimer already accepted for this session
        const accepted = sessionStorage.getItem("disclaimerAccepted");
        if (accepted === "true") {
            setShowDisclaimer(false);
        } else {
            setShowDisclaimer(true);
        }
    }, []);

    const handleAcceptDisclaimer = () => {
        sessionStorage.setItem("disclaimerAccepted", "true");
        for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        console.log(`${key}: ${sessionStorage.getItem(key)}`)}
        setShowDisclaimer(false);
    };

    return (
        <>
            {/* Conditional rendering for both modals */}
            {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}
            {showEula && <EulaModal onAccept={handleAcceptEula} />}

            <Hero />
            <Content />
            <ListingsSection listings={listings} loading={loading} error={error} />
        </>
    );
};

export default HomePage;