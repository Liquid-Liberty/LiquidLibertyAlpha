import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { serviceCategories, mockAds } from '../data/mockData';
import AdSidebar from '../components/AdSidebar';
import { useListings } from '../context/ListingsContext';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { lmktConfig, paymentProcessorConfig, treasuryConfig } from '../contract-config';
import { parseEther } from 'viem';

const ListingDetailPage = ({ listings }) => {
    const { data: tokenPrice, refetch: refetchLMKTPrice } = useReadContract({
        address: treasuryConfig.address,
        abi: treasuryConfig.abi,
        functionName: 'getLMKTPrice',
        args: [],
        query: { enabled: !!userAddress }
    });

    useEffect(() => {
        refetchLMKTPrice()
        if (tokenPrice) setLmktPrice(tokenPrice);
    }, [refetchLMKTPrice, userAddress, isConnected, tokenPrice]);

    const handleBuyNow = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Waiting Approval ...');
        const approveAmount = (parseEther((listing.price * 1.1).toString()) * 100000000n) / BigInt(lmktPrice);
        approve({
            address: lmktConfig.address,
            abi: lmktConfig.abi,
            functionName: 'approve',
            args: [paymentProcessorConfig.address, approveAmount],
        });
    };

    useEffect(() => {
        if (isApproved) {
            setStatusMessage('Approved! Please confirm the final transaction...');
            handleBuy({
                address: paymentProcessorConfig.address,
                abi: paymentProcessorConfig.abi,
                functionName: 'makePurchase',
                args: [
                    listing.id,
                    parseEther(listing.price.toString()),
                    listing.owner
                ]
            });
        }
    }, [isApproved]);

    useEffect(() => {
        if (isBought) {
            setIsLoading(false);
            setStatusMessage('');
            alert("Purchase successful!");
            setTimeout(() => {
                refreshData();
            }, 2000);
        }
    }, [isBought, refreshData]);
    const { id } = useParams();
    // const { listings: blockchainListings, loading, error } = useListings();
    const { address: userAddress, isConnected } = useAccount();
    const { listings: blockchainListings, loading, error, refreshData } = useListings();
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const { data: approveHash, writeContract: approve } = useWriteContract();
    const { data: buyHash, writeContract: handleBuy } = useWriteContract();
    const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: isBought, isError: isBuyError, error: buyError } = useWaitForTransactionReceipt({ hash: buyHash });
    const [lmktPrice, setLmktPrice] = useState(100000000);
    // const item_listings = blockchainListings.filter(l => l.listingType === 'item');
    const listing = blockchainListings.find(l => l.id.toString() === id);
    const [mainImage, setMainImage] = useState(`https://ipfs.io/ipfs/${listing.imageUrl}` || '');
    if (!listing) {
        return <div className="text-center py-20 font-display text-2xl">Listing not found.</div>;
    }

    const isService = listing.listingType === 'service';

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <div className="aspect-w-4 aspect-h-3 mb-4">
                                    <img src={mainImage} alt={listing.title} className="w-full h-full object-cover rounded-lg shadow-md" />
                                </div>
                                {/* {listing.imageUrl.length > 1 && ( */}
                                <div className="flex space-x-2">
                                    {/* {listing.photos.map((photo, index) => ( */}
                                    <button key={listing.id} onClick={() => setMainImage(`https://ipfs.io/ipfs/${listing.imageUrl}`)} className={`w-20 h-20 rounded-md overflow-hidden border-2 border-teal-500`}>
                                        {/* <button key={listing.id} onClick={() => setMainImage(`https://ipfs.io/ipfs/${listing.imageUrl}`)} className={`w-20 h-20 rounded-md overflow-hidden border-2 ${mainImage === photo.preview ? 'border-teal-500' : 'border-transparent'}`}> */}
                                        <img src={`https://ipfs.io/ipfs/${listing.imageUrl}`} alt={`Thumbnail ${listing.id + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                    {/* ))} */}
                                </div>
                                {/* )} */}
                            </div>

                            <div>
                                <h1 className="font-display text-4xl font-bold text-zinc-900">{listing.title}</h1>
                                <p className="font-body text-4xl text-teal-800 my-4">
                                    ${listing.price.toFixed(2)}
                                    {isService && <span className="text-2xl text-zinc-600 ml-2">{listing.rateType}</span>}
                                </p>
                                <div className="space-y-4 text-zinc-700">
                                    <p className="whitespace-pre-wrap">{listing.description}</p>
                                    <hr />
                                    <p><span className="font-bold">Location:</span> Zip Code {listing.zipCode}</p>
                                    {!isService && (
                                        <p><span className="font-bold">Delivery:</span> {listing.deliveryMethod === 'pickup' ? 'In-Person Pickup' : `Shipping (${listing.shippingCost ? '$' + parseFloat(listing.shippingCost).toFixed(2) : 'N/A'})`}</p>
                                    )}
                                    {isService && (
                                        <p><span className="font-bold">Service Category:</span> {serviceCategories.find(c => c.key === listing.serviceCategory)?.name}</p>
                                    )}
                                </div>
                                <button className="w-full mt-8 bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg" onClick={handleBuyNow}>
                                    {isService ? 'Contact Provider' : isLoading ? 'Processing...' : 'Buy Now'}
                                </button>
                                {statusMessage && <p className="text-sm text-zinc-600 mt-2">{statusMessage}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 hidden lg:block">
                        <div className="sticky top-24">
                            <h3 className="font-display text-xl font-bold mb-4 text-zinc-800">Sponsored</h3>
                            <AdSidebar ad={mockAds.sidebar} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailPage;
