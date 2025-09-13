import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useListings } from './context/ListingsContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ForSalePage from './pages/ForSalePage';
import ForSaleCategoryPage from './pages/ForSaleCategoryPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceCategoryPage from './pages/ServiceCategoryPage';
import CreateListingPage from './pages/CreateListingPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import LocateVendorPage from './pages/LocateVendorPage';
import NotFoundPage from './pages/NotFoundPage';
import { useContractConfig } from './hooks/useContractConfig';

function App() {
    const { listings, refreshListings } = useListings();
    const [notification, setNotification] = useState('');
    const location = useLocation();
    const { address, isConnected } = useAccount();

    const { data: faucetHash, writeContract: requestTokens } = useWriteContract();
    const { isSuccess: isFaucetSuccess } = useWaitForTransactionReceipt({ hash: faucetHash });

    const { faucetConfig, loading: contractsLoading } = useContractConfig();
    console.log("faucetConfig in App.jsx:", faucetConfig);

    useEffect(() => {
        if (isFaucetSuccess) {
            setNotification('Tokens successfully received! 🎉');
            setTimeout(() => setNotification(''), 4000);
        }
    }, [isFaucetSuccess]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const addListing = (newListing, isEditing) => {
        // Refresh data from blockchain after adding listing
        refreshListings();
        setNotification('Listing created successfully!');
        setTimeout(() => setNotification(''), 4000);
    };

    const deleteListing = (id) => {
        // Refresh data from blockchain after deleting listing
        refreshListings();
        setNotification('Listing deleted.');
        setTimeout(() => setNotification(''), 4000);
    };

    const triggerFaucet = () => {
        if (!isConnected) {
            setNotification('Please connect your wallet to use the faucet.');
            setTimeout(() => setNotification(''), 4000);
            return;
        }
        console.log("🔎 trigger faucet in App.jsx:", faucetConfig);
        try {
            requestTokens({
                ...faucetConfig,
                functionName: 'requestTokens',
            });
            setNotification('Faucet request sent... waiting for confirmation.');
        } catch (error) {
            console.error("Faucet request failed:", error);
            let errorMessage = 'Faucet request failed.';
            if (error?.message.includes('COOLDOWN')) {
                errorMessage = 'You must wait before requesting tokens again.';
            }
            setNotification(errorMessage);
            setTimeout(() => setNotification(''), 4000);
        }
    };

    return (
        <div className="min-h-screen font-body text-zinc-800 relative isolate flex flex-col">
            <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/market-background.png')" }}></div>
            <div className="fixed inset-0 -z-10 bg-black/30"></div>
            <Header onFaucetClick={triggerFaucet} />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/for-sale" element={<ForSalePage />} />
                    <Route path="/for-sale/:categoryName" element={<ForSaleCategoryPage listings={listings} />} />
                    <Route path="/listing/:id" element={<ListingDetailPage listings={listings} />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:categoryName" element={<ServiceCategoryPage listings={listings} />} />
                    <Route path="/create-listing" element={<CreateListingPage addListing={addListing} listings={listings} />} />
                    <Route path="/edit-listing/:id" element={<CreateListingPage addListing={addListing} listings={listings} />} />
                    <Route path="/vendors" element={<VendorsPage />} />
                    <Route path="/locate-vendor" element={<LocateVendorPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            {notification && (
                <div className="fixed bottom-5 right-5 bg-teal-800 text-white py-3 px-6 rounded-lg shadow-lg animate-fade-in-out">
                    {notification}
                </div>
            )}
            <Footer />
        </div>
    );
}

export default App;