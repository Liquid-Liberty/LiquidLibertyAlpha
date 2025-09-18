import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useListings } from "./context/ListingsContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ForSalePage from "./pages/ForSalePage";
import ForSaleCategoryPage from "./pages/ForSaleCategoryPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceCategoryPage from "./pages/ServiceCategoryPage";
import CreateListingPage from "./pages/CreateListingPage";
import DashboardPage from "./pages/DashboardPage";
import VendorsPage from "./pages/VendorsPage";
import LocateVendorPage from "./pages/LocateVendorPage";
import RewardsPage from "./pages/RewardsPage"; // --- IMPORT ADDED ---
import NotFoundPage from "./pages/NotFoundPage";
import { useContractConfig } from "./hooks/useContractConfig";
import { useSubqueryConfig } from "./config/subgraph-config.js";

function App() {
  const { listings, refreshListings } = useListings();
  const [notification, setNotification] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // Track previous connection state to detect reconnections
  const prevIsConnected = useRef(null); // Start with null to detect initial state
  const prevAddress = useRef(null);
  const hasInitialized = useRef(false);
  const wasRecentlyDisconnected = useRef(false); // Track if user just disconnected
  const [connectionHistory, setConnectionHistory] = useState([]); // Debug: track connection changes

  // 🔑 Global chart state (persists across navigation)
  const [widget, setWidget] = useState(undefined);
  const [interval] = useState("5");

  // Get secure treasury address for current network
  const { TREASURY_ADDRESS, PAIR_ADDRESS } = useSubqueryConfig();

  // Pool data with correct treasury address
  const mockPoolData = {
    poolAddress: TREASURY_ADDRESS, // Use actual treasury address instead of fake
    baseMint: TREASURY_ADDRESS,
    quoteMint: "0x0987654321098765432109876543210987654321",
    price: 0.00012345,
    liquidity: 1000000,
    mcap: 50000,
    baseSymbol: "LMKT",
    baseName: "Liberty Market Token",
    quoteSymbol: "USD",
    quoteName: "USD",
    dex: "Uniswap",
    dexImage: "/uniswap.png",
    v24hUSD: 25000,
  };

  const { data: faucetHash, writeContract: requestTokens } = useWriteContract();
  const { isSuccess: isFaucetSuccess } = useWaitForTransactionReceipt({
    hash: faucetHash,
  });

  const { faucetConfig } = useContractConfig();

  useEffect(() => {
    if (isFaucetSuccess) {
      setNotification("Tokens successfully received! 🎉");
      setTimeout(() => setNotification(""), 4000);
    }
  }, [isFaucetSuccess]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle wallet reconnection - redirect to homepage
  useEffect(() => {
    // Add to connection history for debugging
    const historyEntry = {
      timestamp: Date.now(),
      isConnected,
      address: address || 'undefined',
      path: location.pathname
    };
    setConnectionHistory(prev => [...prev.slice(-5), historyEntry]); // Keep last 6 entries

    // Check if user was recently disconnected (persisted in localStorage)
    const wasDisconnectedPersisted = localStorage.getItem('wallet_was_disconnected') === 'true';

    // Skip initial render to avoid redirecting on page load
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevIsConnected.current = isConnected;
      prevAddress.current = address;

      // If user was disconnected and is now connected, trigger redirect
      if (wasDisconnectedPersisted && isConnected && address) {
        console.log("🔄 Detected reconnection after component re-mount, redirecting to homepage");
        localStorage.removeItem('wallet_was_disconnected'); // Clear the flag
        navigate("/");
        return;
      }

      console.log("🔧 Initialized wallet tracking:", { isConnected, address, wasDisconnectedPersisted });
      return;
    }

    const wasConnected = prevIsConnected.current === true;
    const isNowConnected = isConnected === true;
    const wasDisconnected = prevIsConnected.current === false;
    const isNowDisconnected = isConnected === false;

    // Track disconnection
    if (wasConnected && isNowDisconnected) {
      console.log("📱 Wallet disconnected, marking as recently disconnected");
      wasRecentlyDisconnected.current = true;
      localStorage.setItem('wallet_was_disconnected', 'true'); // Persist across re-mounts
    }

    // Detect reconnection (was recently disconnected, now connected)
    const isReconnecting = wasRecentlyDisconnected.current && isNowConnected;

    // Address changed while connected (account switch)
    const addressChanged = wasConnected && isConnected && prevAddress.current !== address && address;

    // Alternative simple check: if we have an address now but didn't before, it's likely a reconnection
    const simpleReconnection = !prevAddress.current && address && isConnected;

    console.log("Wallet state:", {
      // Current states
      isConnected,
      address,

      // Previous states
      'prevIsConnected.current': prevIsConnected.current,
      'prevAddress.current': prevAddress.current,

      // Calculated states
      wasConnected,
      isNowConnected,
      wasDisconnected,
      isNowDisconnected,
      isReconnecting,
      addressChanged,
      simpleReconnection,
      'wasRecentlyDisconnected.current': wasRecentlyDisconnected.current,

      // Context
      currentPath: location.pathname,
      connectionHistory: connectionHistory.slice(-3) // Show last 3 entries
    });

    // Redirect to homepage if:
    // 1. User is reconnecting after disconnection
    // 2. Address changed while connected (account switch)
    // 3. Simple reconnection detected (address appeared)
    if (isReconnecting || addressChanged || simpleReconnection) {
      console.log("🔄 Wallet reconnected or account switched, redirecting to homepage");
      wasRecentlyDisconnected.current = false; // Reset the flag
      localStorage.removeItem('wallet_was_disconnected'); // Clear persisted flag
      navigate("/");
    }

    // Update refs for next comparison
    prevIsConnected.current = isConnected;
    prevAddress.current = address;
  }, [isConnected, address, navigate, location.pathname]);

  const addListing = () => {
    refreshListings();
    setNotification("Listing created successfully!");
    setTimeout(() => setNotification(""), 4000);
  };

  const triggerFaucet = () => {
    if (!isConnected) {
      setNotification("Please connect your wallet to use the faucet.");
      setTimeout(() => setNotification(""), 4000);
      return;
    }
    try {
      requestTokens({
        ...faucetConfig,
        functionName: "requestTokens",
      });
      setNotification("Faucet request sent... waiting for confirmation.");
    } catch (error) {
      console.error("Faucet request failed:", error);
      let errorMessage = "Faucet request failed.";
      if (error?.message.includes("COOLDOWN")) {
        errorMessage = "You must wait before requesting tokens again.";
      }
      setNotification(errorMessage);
      setTimeout(() => setNotification(""), 4000);
    }
  };

  return (
    <div className="min-h-screen font-body text-zinc-800 relative isolate flex flex-col">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/market-background.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/30" />

      <Header onFaucetClick={triggerFaucet} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/for-sale" element={<ForSalePage />} />
          <Route
            path="/for-sale/:categoryName"
            element={<ForSaleCategoryPage listings={listings} />}
          />
          <Route
            path="/listing/:id"
            element={<ListingDetailPage listings={listings} />}
          />
          <Route path="/services" element={<ServicesPage />} />
          <Route
            path="/services/:categoryName"
            element={<ServiceCategoryPage listings={listings} />}
          />
          <Route
            path="/create-listing"
            element={
              <CreateListingPage addListing={addListing} listings={listings} />
            }
          />
          <Route
            path="/edit-listing/:id"
            element={
              <CreateListingPage addListing={addListing} listings={listings} />
            }
          />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/locate-vendor" element={<LocateVendorPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                listings={listings}
                userAddress={address}
                widget={widget}
                setWidget={setWidget}
                interval={interval}
                mockPoolData={mockPoolData}
              />
            }
          />
          {/* --- ROUTE ADDED --- */}
          <Route path="/rewards" element={<RewardsPage />} />
          
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