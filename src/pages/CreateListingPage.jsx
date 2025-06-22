import React, { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { serviceCategories } from '../data/mockData';

const CreateListingPage = ({ addListing, listings }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = id !== undefined;
    const existingListing = isEditing ? listings.find(l => l.id.toString() === id) : null;

    const [listingType, setListingType] = useState(existingListing?.type || 'item');
    const [title, setTitle] = useState(existingListing?.title || '');
    const [price, setPrice] = useState(existingListing?.price || '');
    const [rateType, setRateType] = useState(existingListing?.rateType || 'flat fee');
    const [zipCode, setZipCode] = useState(existingListing?.zipCode || '');
    const [deliveryMethod, setDeliveryMethod] = useState(existingListing?.deliveryMethod || 'pickup');
    const [shippingCost, setShippingCost] = useState(existingListing?.shippingCost || '');
    const [serviceCategory, setServiceCategory] = useState(existingListing?.serviceCategory || '');
    const [description, setDescription] = useState(existingListing?.description || '');
    const [photos, setPhotos] = useState(existingListing?.photos || []);

    const currentUser = useContext(UserContext);

    const handlePhotoChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const filesWithPreviews = filesArray.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setPhotos(filesWithPreviews);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentUser?.isConnected) {
            alert("Please connect your wallet to create a listing.");
            return;
        }

        let newListing = {
            id: isEditing ? existingListing.id : Date.now(),
            type: listingType,
            title,
            price: parseFloat(price),
            zipCode,
            description,
            photos,
            date: new Date(),
            sellerId: currentUser.address
        };

        if (listingType === 'item') {
            newListing = { ...newListing, deliveryMethod, shippingCost: deliveryMethod === 'shipping' ? shippingCost : null };
        } else { // service
            newListing = { ...newListing, serviceCategory, rateType };
        }

        addListing(newListing, isEditing);
        navigate('/dashboard');
    };

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
                        <button type="submit" className="bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg">
                            {isEditing ? 'Save Changes' : 'Pay & Create Listing'}
                        </button>
                        <p className="text-sm text-zinc-600 mt-3">
                            {isEditing ? 'No fee is required to edit a listing.' : 'A fee of ~$5 (paid in whitelisted tokens) is required to create a listing.'}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListingPage;
