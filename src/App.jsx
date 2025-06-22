import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';

// Context and Data
import { UserContext } from './context/UserContext';
// FIXED: Changed 'initialListings' to the correct export name 'userListings'
import { userListings } from './data/mockData'; 

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';

// Page Components
import HomePage from './pages/HomePage';
import ForSalePage from './pages/ForSalePage';
import ListingDetailPage from './pages/ListingDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceCategoryPage from './pages/ServiceCategoryPage';
import CreateListingPage from './pages/CreateListingPage';
import DashboardPage from './pages/DashboardPage';
import VendorsPage from './pages/VendorsPage';
import LocateVendorPage from './pages/LocateVendorPage';
import NotFoundPage from './pages/NotFoundPage';


// MAIN APP COMPONENT
function App() {
    // FIXED: Using the correct variable name here as well
    const [listings, setListings] = useState(userListings); 
    const [notification, setNotification] = useState('');
    const location = useLocation();
    const { address, isConnected } = useAccount();

    // Effect to scroll to top on page change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // Function to add or update a listing
    const addListing = (newListing, isEditing) => {
        if (isEditing) {
            setListings(prev => prev.map(l => l.id === newListing.id ? newListing : l));
            setNotification('Listing updated successfully!');
        } else {
            setListings(prevListings => [newListing, ...prevListings]);
            setNotification('Listing created successfully!');
        }
        setTimeout(() => setNotification(''), 4000);
    };

    // Function to delete a listing
    const deleteListing = (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this listing?");
        if (isConfirmed) {
            setListings(prev => prev.filter(l => l.id !== id));
            setNotification('Listing deleted.');
            setTimeout(() => setNotification(''), 4000);
        }
    };

    // Function to trigger the faucet
    const triggerFaucet = () => {
        if (!isConnected) {
            setNotification('Please connect your wallet to use the faucet.');
        } else {
            setNotification('Faucet request sent for ' + address.slice(0, 6) + '...');
            console.log("Faucet triggered for:", address);
        }
        setTimeout(() => setNotification(''), 4000);
    };

    return (
        <UserContext.Provider value={{ address, isConnected }}>
            <div className="min-h-screen font-body text-zinc-800 relative isolate flex flex-col">
                <div
                    className="fixed inset-0 -z-10 bg-cover bg-center"
                    style={{ backgroundImage: "url('/market-background.png')" }}
                ></div>
                <div className="fixed inset-0 -z-10 bg-black/30"></div>

                <Header onFaucetClick={triggerFaucet} />

                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/for-sale" element={<ForSalePage listings={listings} />} />
                        <Route path="/listing/:id" element={<ListingDetailPage listings={listings} />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/services/:categoryName" element={<ServiceCategoryPage listings={listings} />} />
                        <Route path="/create-listing" element={<CreateListingPage addListing={addListing} listings={listings} />} />
                        <Route path="/edit-listing/:id" element={<CreateListingPage addListing={addListing} listings={listings} />} />
                        <Route path="/vendors" element={<VendorsPage />} />
                        <Route path="/locate-vendor" element={<LocateVendorPage />} />
                        <Route path="/dashboard" element={
                            <DashboardPage 
                                // Note: We will need to update the props passed here later
                            />
                        }/>
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
        </UserContext.Provider>
    );
}

export default App;
