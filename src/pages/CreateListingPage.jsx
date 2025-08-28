import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parseEther } from 'viem';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { listingManagerConfig, lmktConfig, treasuryConfig } from '../contract-config';
import { forSaleCategories, serviceCategories } from '../data/categories';
import { filesToBase64Array, validateImageFiles, compressImage } from '../utils/imageUtils';


const CreateListingPage = ({ addListing, listings }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = id !== undefined;
    const existingListing = isEditing ? listings.find(l => l.id.toString() === id) : null;

    const [listingType, setListingType] = useState(existingListing?.type || 'item');
    const [title, setTitle] = useState(existingListing?.title || '');
    const [category, setCategory] = useState(existingListing?.category || '');
    const [price, setPrice] = useState(existingListing?.price || '');
    const [rateType, setRateType] = useState(existingListing?.rateType || 'flat fee');
    const [zipCode, setZipCode] = useState(existingListing?.zipCode || '');
    const [deliveryMethod, setDeliveryMethod] = useState(existingListing?.deliveryMethod || 'pickup');
    const [shippingCost, setShippingCost] = useState(existingListing?.shippingCost || '');
    const [serviceCategory, setServiceCategory] = useState(existingListing?.serviceCategory || '');
    const [description, setDescription] = useState(existingListing?.description || '');
    const [photos, setPhotos] = useState(existingListing?.photos || []);
    const [lmktPrice, setLmktPrice] = useState(100000000);

    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const { address: userAddress, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: approveHash, writeContract: approve } = useWriteContract();
    const { data: createListingHash, writeContract: createListing } = useWriteContract();
    const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: isCreated } = useWaitForTransactionReceipt({ hash: createListingHash });
    const signatureRef = useRef(null);
    const ipfsHashRef = useRef(null);

    useEffect(() => {
        setCategory('');
        setServiceCategory('');
    }, [listingType]);

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
    }, [refetchLMKTPrice, userAddress, photos, isConnected, tokenPrice]);

    const handlePhotoChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const filesWithPreviews = filesArray.map(file => ({ file, preview: URL.createObjectURL(file) }));
            setPhotos(filesWithPreviews);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected || !userAddress) {
            alert("Please connect your wallet.");
            return;
        }

        // Validate photos if provided
        if (photos.length > 0) {
            try {
                validateImageFiles(photos.map(p => p.file));
            } catch (error) {
                alert(`Photo validation error: ${error.message}`);
                return;
            }
        }

        setIsLoading(true);
        setStatusMessage('Uploading images to IPFS...');

        try {
            let dataIdentifier = "ipfs://placeholder-for-uploaded-photos";

            // Upload images to IPFS if photos are provided
            if (photos.length > 0) {
                try {
                    // Compress and convert photos to base64
                    const compressedPhotos = await Promise.all(
                        photos.map(async (photo) => {
                            const compressed = await compressImage(photo.file);
                            return compressed;
                        })
                    );

                    const base64Photos = await filesToBase64Array(compressedPhotos);

                    // Prepare listing data for IPFS
                    const listingData = {
                        title,
                        description,
                        listingType: listingType === 'item' ? 'item' : 'service',
                        userAddress,
                        category: listingType === 'item' ? category : serviceCategory,
                        price: parseFloat(price),
                        zipCode,
                        deliveryMethod: listingType === 'item' ? deliveryMethod : undefined,
                        shippingCost: listingType === 'item' && deliveryMethod === 'shipping' ? parseFloat(shippingCost) : undefined,
                        rateType: listingType === 'service' ? rateType : undefined,
                        createdAt: new Date().toISOString()
                    };

                    // Upload to IPFS
                    const uploadResponse = await fetch('/.netlify/functions/upload-images-to-ipfs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            images: base64Photos,
                            listingData
                        })
                    });

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        throw new Error(errorData.error || 'Failed to upload images to IPFS');
                    }

                    const uploadResult = await uploadResponse.json();
                    dataIdentifier = uploadResult.listingMetadataUrl;
                    ipfsHashRef.current = uploadResult.listingMetadataHash;
                    setStatusMessage('Images uploaded! Requesting signature...');
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    alert(`Image upload failed: ${uploadError.message}`);
                    setIsLoading(false);
                    setStatusMessage('');
                    return;
                }
            }

            const listingTypeEnum = listingType === 'item' ? 0 : 1;
            const feeInToken = parseEther(listingType === 'item' ? '5' : '20');  //Check feeInToken implementation
            const deadline = Math.floor(Date.now() / 1000) + 3600;

            const signatureRequestData = {
                listingType: listingTypeEnum,
                dataIdentifier,
                userAddress,
                feeInToken: feeInToken.toString(),
                deadline,
                chainId,
                verifyingContract: listingManagerConfig.address
            };

            const signatureResponse = await fetch('/.netlify/functions/create-listing-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signatureRequestData)
            });

            if (!signatureResponse.ok) throw new Error('Failed to get server signature.');

            const { signature } = await signatureResponse.json();
            signatureRef.current = signature;

            setStatusMessage('Please approve the listing fee...');
            const feeInUsd = (feeInToken * 100000000n) / BigInt(lmktPrice);
            approve({
                address: lmktConfig.address,
                abi: lmktConfig.abi,
                functionName: 'approve',
                args: [listingManagerConfig.address, feeInUsd],
            });

        } catch (error) {
            console.error("Step 1/2 (Signature/Approval) Failed:", error);
            alert(`Error: ${error.message}`);
            setIsLoading(false);
            setStatusMessage('');
        }
    };

    useEffect(() => {
        if (isApproved) {
            setStatusMessage('Approved! Please confirm the final listing transaction...');

            const listingTypeEnum = listingType === 'item' ? 0 : 1;
            const feeInToken = parseEther(listingType === 'item' ? '5' : '20'); //Confirm feeInToken implementation
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const dataIdentifier = ipfsHashRef.current ? `ipfs://${ipfsHashRef.current}` : "ipfs://placeholder-for-uploaded-photos";

            const createListingArgs = [
                listingTypeEnum,
                dataIdentifier,
                feeInToken,
                deadline,
                signatureRef.current
            ];

            createListing({
                address: listingManagerConfig.address,
                abi: listingManagerConfig.abi,
                functionName: 'createListing',
                args: createListingArgs
            });
        }
    }, [isApproved]);

    useEffect(() => {
        if (isCreated) {
            setIsLoading(false);
            setStatusMessage('');
            alert("Listing created successfully!");
            navigate('/dashboard');
        }
    }, [isCreated, navigate]);

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
                <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">{isEditing ? 'Edit Listing' : 'Create a Listing'}</h1>

                {!isEditing && (
                    <div className="flex justify-center mb-8">
                        <div className="flex p-1 bg-stone-200 rounded-lg">
                            <button onClick={() => setListingType('item')} className={`px-6 py-2 rounded-md font-bold ${listingType === 'item' ? 'bg-teal-800 text-white' : 'text-zinc-700'}`}>Item for Sale</button>
                            <button onClick={() => setListingType('service')} className={`px-6 py-2 rounded-md font-bold ${listingType === 'service' ? 'bg-teal-800 text-white' : 'text-zinc-700'}`}>Service Offered</button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <label htmlFor="title" className="block text-lg font-bold text-zinc-700 mb-2">Listing Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                    </div>

                    {listingType === 'item' && (
                        <>
                            <div>
                                <label htmlFor="category" className="block text-lg font-bold text-zinc-700 mb-2">Category</label>
                                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition">
                                    <option value="" disabled>Select a category...</option>
                                    {forSaleCategories.map(cat => <option key={cat.key} value={cat.key}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="price" className="block text-lg font-bold text-zinc-700 mb-2">Price (USD)</label>
                                    <input type="number" step="0.01" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g., 50.00" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                </div>
                                <div>
                                    <label htmlFor="zipCode" className="block text-lg font-bold text-zinc-700 mb-2">Location (Zip Code)</label>
                                    <input type="text" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required placeholder="e.g., 10001" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-lg font-bold text-zinc-700 mb-2">Delivery Method</label>
                                <div className="flex items-center space-x-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={(e) => setDeliveryMethod(e.target.value)} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300" />
                                        <span className="ml-3 text-zinc-800">Pickup In-Person</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="deliveryMethod" value="shipping" checked={deliveryMethod === 'shipping'} onChange={(e) => setDeliveryMethod(e.target.value)} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300" />
                                        <span className="ml-3 text-zinc-800">Shipping</span>
                                    </label>
                                </div>
                            </div>
                            {deliveryMethod === 'shipping' && (
                                <div>
                                    <label htmlFor="shippingCost" className="block text-lg font-bold text-zinc-700 mb-2">Shipping Cost (USD)</label>
                                    <input type="number" step="0.01" id="shippingCost" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} required={deliveryMethod === 'shipping'} placeholder="Enter shipping fee" className="w-full md:w-1/2 px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                </div>
                            )}
                        </>
                    )}

                    {listingType === 'service' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="serviceCategory" className="block text-lg font-bold text-zinc-700 mb-2">Service Category</label>
                                    <select id="serviceCategory" value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition">
                                        <option value="" disabled>Select a category...</option>
                                        {serviceCategories.map(cat => <option key={cat.key} value={cat.key}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="zipCode" className="block text-lg font-bold text-zinc-700 mb-2">Service Area (Zip Code)</label>
                                    <input type="text" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required placeholder="e.g., 10001" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="price" className="block text-lg font-bold text-zinc-700 mb-2">Rate (USD)</label>
                                    <input type="number" step="0.01" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g., 50.00" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                </div>
                                <div>
                                    <label htmlFor="rateType" className="block text-lg font-bold text-zinc-700 mb-2">Rate Type</label>
                                    <select id="rateType" value={rateType} onChange={(e) => setRateType(e.target.value)} className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition">
                                        <option value="flat fee">Flat Fee</option>
                                        <option value="per hour">Per Hour</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="description" className="block text-lg font-bold text-zinc-700 mb-2">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="6" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"></textarea>
                    </div>
                    <div>
                        <label className="block text-lg font-bold text-zinc-700 mb-2">Attach Photos</label>
                        <input type="file" id="photos" onChange={handlePhotoChange} multiple accept="image/*" className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                        {photos.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img src={photo.preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-center pt-4">
                        <button type="submit" disabled={isLoading} className="bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg disabled:bg-zinc-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Pay & Create Listing')}
                        </button>
                        <p className="text-sm text-zinc-600 mt-3">
                            {isEditing
                                ? "No fee is required to edit a listing."
                                : `A fee of ~$${listingType === "item" ? "5" : "20"} (paid in whitelisted tokens) is required to create a listing.`}
                        </p>
                        {statusMessage && <p className="text-md text-zinc-600 mt-4 animate-pulse">{statusMessage}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListingPage;