import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { serviceCategories, mockAds } from '../data/mockData';
import AdSidebar from '../components/AdSidebar';
import { useListings } from '../context/ListingsContext';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { lmktConfig, treasuryConfig, paymentProcessorConfig } from '../config/contracts';

const ListingDetailPage = () => {
  const { id } = useParams();
  const { listings, loading, error, refreshListings } = useListings();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const listing = listings.find((l) => l.id.toString() === id);
  const [mainImage, setMainImage] = useState(listing?.imageUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const { data: approveHash, writeContractAsync: approveAsync } = useWriteContract();
  const { data: buyHash, writeContractAsync: buyAsync } = useWriteContract();
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: isBought } = useWaitForTransactionReceipt({ hash: buyHash });

  if (loading) return <div className="text-center py-20 font-display text-2xl">Loading listing...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!listing) return <div className="text-center py-20 font-display text-2xl">Listing not found.</div>;

  const isService = listing.listingType === 'ServiceOffered';
  const isOwner = address?.toLowerCase() === listing.owner.toLowerCase(); // ✅ Prevent buying own listing

  const handleBuyNow = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage("1/2: Approving LMKT...");

      // --- Fetch LMKT price from Treasury ---
      const lmktPriceInUsd = await publicClient.readContract({
        address: treasuryConfig.address,
        abi: treasuryConfig.abi,
        functionName: 'getLmktPriceInUsd',
      });

      if (lmktPriceInUsd === 0n) {
        throw new Error("Invalid LMKT price from Treasury");
      }

      // Convert USD price → LMKT amount
      const itemPriceInLmkt = (BigInt(Math.floor(listing.priceInUsd * 1e8)) * BigInt(10 ** 18)) / lmktPriceInUsd;
      const maxLmktToPay = (itemPriceInLmkt * 101n) / 100n; // 1% slippage buffer

      // Step 1: Approve LMKT
      await approveAsync({
        address: lmktConfig.address,
        abi: lmktConfig.abi,
        functionName: 'approve',
        args: [paymentProcessorConfig.address, maxLmktToPay],
      });

      setStatusMessage("2/2: Executing purchase...");
      // Step 2: Execute Payment
      await buyAsync({
        address: paymentProcessorConfig.address,
        abi: paymentProcessorConfig.abi,
        functionName: 'executePayment',
        args: [listing.id, maxLmktToPay],
      });
    } catch (err) {
      console.error("Purchase failed:", err);
      alert(err.message || "Failed to complete purchase");
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  // After purchase success
  if (isApproved) {
    setStatusMessage("Approved! Confirming purchase...");
  }

  if (isBought) {
    setIsLoading(false);
    setStatusMessage("");
    alert("Purchase successful!");
    refreshListings();
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="aspect-w-4 aspect-h-3 mb-4">
                  <img
                    src={mainImage}
                    alt={listing.title}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </div>
                {listing.imageUrl && (
                  <div className="flex space-x-2">
                    <button
                      key={listing.id}
                      onClick={() => setMainImage(listing.imageUrl)}
                      className="w-20 h-20 rounded-md overflow-hidden border-2 border-teal-500"
                    >
                      <img
                        src={listing.imageUrl}
                        alt={`Thumbnail ${listing.id}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div>
                <h1 className="font-display text-4xl font-bold text-zinc-900">
                  {listing.title}
                </h1>
                <p className="font-body text-4xl text-teal-800 my-4">
                  ${listing.priceInUsd.toFixed(2)}
                  {isService && (
                    <span className="text-2xl text-zinc-600 ml-2">
                      {listing.rateType}
                    </span>
                  )}
                </p>
                <div className="space-y-4 text-zinc-700">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                  <hr />
                  {listing.zipCode && (
                    <p>
                      <span className="font-bold">Location:</span> Zip Code {listing.zipCode}
                    </p>
                  )}
                  {!isService && (
                    <p>
                      <span className="font-bold">Delivery:</span>{" "}
                      {listing.deliveryMethod === "pickup"
                        ? "In-Person Pickup"
                        : `Shipping (${listing.shippingCost
                            ? "$" + parseFloat(listing.shippingCost).toFixed(2)
                            : "N/A"})`}
                    </p>
                  )}
                  {isService && (
                    <p>
                      <span className="font-bold">Service Category:</span>{" "}
                      {serviceCategories.find((c) => c.key === listing.serviceCategory)?.name}
                    </p>
                  )}
                </div>

                {/* Conditional Button */}
                {isService ? (
                  <button
                    className="w-full mt-8 bg-blue-600 text-stone-100 py-3 px-12 rounded-md hover:bg-blue-700 transition duration-300 font-bold text-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isOwner}
                    onClick={() => alert("Contact Provider feature coming soon!")}
                  >
                    {isOwner ? "You Own This Listing" : "Contact Provider"}
                  </button>
                ) : (
                  <button
                    className="w-full mt-8 bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleBuyNow}
                    disabled={isLoading || isOwner}
                  >
                    {isOwner
                      ? "You Own This Listing"
                      : isLoading
                      ? "Processing..."
                      : "Buy Now"}
                  </button>
                )}
                {statusMessage && (
                  <p className="text-sm text-zinc-600 mt-2">{statusMessage}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Ads */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24">
              <h3 className="font-display text-xl font-bold mb-4 text-zinc-800">
                Sponsored
              </h3>
              <AdSidebar ad={mockAds.sidebar} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
