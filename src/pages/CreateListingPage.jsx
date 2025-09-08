import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { forSaleCategories, serviceCategories } from "../data/categories";
import { useContractConfig } from "../hooks/useContractConfig";

const CreateListingPage = ({ listings }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id !== undefined;
  const existingListing = isEditing
    ? listings.find((l) => l.id.toString() === id)
    : null;

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { listingManagerConfig, mockDaiConfig } = useContractConfig(); // ✅ dynamic configs

  const [listingType, setListingType] = useState(
    existingListing?.type || "item"
  );
  const [title, setTitle] = useState(existingListing?.title || "");
  const [category, setCategory] = useState(existingListing?.category || "");
  const [price, setPrice] = useState(existingListing?.price || "");
  const [rateType, setRateType] = useState(
    existingListing?.rateType || "flat fee"
  );
  const [zipCode, setZipCode] = useState(existingListing?.zipCode || "");
  const [deliveryMethod, setDeliveryMethod] = useState(
    existingListing?.deliveryMethod || "pickup"
  );
  const [shippingCost, setShippingCost] = useState(
    existingListing?.shippingCost || ""
  );
  const [serviceCategory, setServiceCategory] = useState(
    existingListing?.serviceCategory || ""
  );
  const [description, setDescription] = useState(
    existingListing?.description || ""
  );
  const [photos, setPhotos] = useState(existingListing?.photos || []);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { data: approveHash, writeContractAsync: approveAsync } =
    useWriteContract();
  const { data: createListingHash, writeContractAsync: createListingAsync } =
    useWriteContract();

  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isSuccess: isCreated } = useWaitForTransactionReceipt({
    hash: createListingHash,
  });

  const signatureDataRef = useRef(null);

  useEffect(() => {
    setCategory("");
    setServiceCategory("");
  }, [listingType]);

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const filesWithPreviews = filesArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPhotos(filesWithPreviews);
    }
  };

  const moderateText = async (text) => {
    const res = await fetch("/.netlify/functions/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.json();
  };

  const moderateImage = async (file) => {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const res = await fetch("/.netlify/functions/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: { data: dataUrl, name: file.name, type: file.type },
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Moderate failed HTTP ${res.status}`);
    return text ? JSON.parse(text) : {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !address) return alert("Please connect your wallet.");
    if (isEditing) return alert("Editing logic not yet implemented.");

    // Guard here before you touch .address
    if (!listingManagerConfig?.address || !mockDaiConfig?.address) {
      console.error("Missing contract config", {
        chainId,
        listingManagerConfig,
        mockDaiConfig,
      });
      alert(
        "Missing contract addresses for this network. Check your loadContractConfig mapping."
      );
      return; // stop execution
    }

    setIsLoading(true);
    try {
      setStatusMessage("0/4: Checking content moderation...");

      if (title) {
        const titleCheck = await moderateText(title);
        if (titleCheck.profane) {
          alert(`❌ Title rejected: ${titleCheck.type.join(", ")}`);
          return setIsLoading(false);
        }
      }

      if (description) {
        const descCheck = await moderateText(description);
        if (descCheck.profane) {
          alert(`❌ Description rejected: ${descCheck.type.join(", ")}`);
          return setIsLoading(false);
        }
      }

      for (let p of photos) {
        const imageCheck = await moderateImage(p.file);
        if (imageCheck.nsfw) {
          alert(`❌ Image rejected: ${imageCheck.type.join(", ")}`);
          return setIsLoading(false);
        }
      }

      setStatusMessage("1/4: Uploading metadata & images to IPFS...");
      const imagePayloads = await Promise.all(
        photos.map((p) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                name: p.file.name,
                type: p.file.type,
                data: reader.result,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(p.file);
          });
        })
      );

      const uploadRes = await fetch(
        "/.netlify/functions/upload-images-to-ipfs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: imagePayloads,
            listingData: {
              title,
              description,
              category: listingType === "item" ? category : null,
              serviceCategory:
                listingType === "service" ? serviceCategory : null,
              rateType: listingType === "service" ? rateType : null,
              zipCode,
              deliveryMethod,
              shippingCost: deliveryMethod === "shipping" ? shippingCost : null,
              listingType,
              userAddress: address,
            },
          }),
        }
      );

      if (!uploadRes.ok) {
        const rawError = await uploadRes.text();
        let error = { error: rawError };
        try {
          error = JSON.parse(rawError);
        } catch {}
        throw new Error(error.error || "IPFS upload failed.");
      }

      const uploadResult = await uploadRes.json();
      const dataIdentifier = uploadResult.listingMetadataUrl;
      console.log("✅ Uploaded to IPFS:", uploadResult);

      setStatusMessage("2/4: Requesting authorization from server...");
      const sigRes = await fetch(
        "/.netlify/functions/create-listing-signature",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: address,
            dataIdentifier,
            chainId,
            verifyingContract: listingManagerConfig.address,
          }),
        }
      );

      if (!sigRes.ok) {
        const rawError = await sigRes.text();
        let error = { error: rawError };
        try {
          error = JSON.parse(rawError);
        } catch {}
        throw new Error(error.error || "Signature request failed.");
      }

      const signatureData = await sigRes.json();
      signatureDataRef.current = { ...signatureData, dataIdentifier };
      console.log("✅ Received signature:", signatureData);

      setStatusMessage("3/4: Approving token transfer...");
      const fee = listingType === "item" ? "5" : "20";
      await approveAsync({
        address: mockDaiConfig.address,
        abi: mockDaiConfig.abi,
        functionName: "approve",
        args: [listingManagerConfig.address, parseUnits(fee, 18)],
      });
    } catch (err) {
      console.error("❌ Error:", err);
      alert(err.message);
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  useEffect(() => {
    if (isApproved && signatureDataRef.current) {
      if (!listingManagerConfig?.address) {
        console.error("Missing ListingManager address", listingManagerConfig);
        return;
      }
      const { signature, nonce, deadline, dataIdentifier } =
        signatureDataRef.current;
      const listingTypeEnum = listingType === "item" ? 0 : 1;
      const priceInUsdBigInt = parseUnits(price, 8);

      setStatusMessage("4/4: Creating listing...");
      createListingAsync({
        address: listingManagerConfig.address,
        abi: listingManagerConfig.abi,
        functionName: "createListing",
        args: [
          listingTypeEnum,
          priceInUsdBigInt,
          dataIdentifier,
          nonce,
          deadline,
          signature,
        ],
      });
    }
  }, [isApproved]);

  useEffect(() => {
    if (isCreated) {
      setIsLoading(false);
      setStatusMessage("");
      alert("✅ Listing created!");
      navigate("/");
    }
  }, [isCreated, navigate]);

  // --- JSX Layout (unchanged) ---
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-center text-zinc-800 mb-8">
          {isEditing ? "Edit Listing" : "Create a Listing"}
        </h1>

        {!isEditing && (
          <div className="flex justify-center mb-8">
            <div className="flex p-1 bg-stone-200 rounded-lg">
              <button
                onClick={() => setListingType("item")}
                className={`px-6 py-2 rounded-md font-bold ${
                  listingType === "item"
                    ? "bg-teal-800 text-white"
                    : "text-zinc-700"
                }`}
              >
                Item for Sale
              </button>
              <button
                onClick={() => setListingType("service")}
                className={`px-6 py-2 rounded-md font-bold ${
                  listingType === "service"
                    ? "bg-teal-800 text-white"
                    : "text-zinc-700"
                }`}
              >
                Service Offered
              </button>
            </div>
          </div>
        )}

        {/* --- Original Form Preserved --- */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-lg font-bold text-zinc-700 mb-2"
            >
              Listing Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>

          {/* Item Flow */}
          {listingType === "item" && (
            <>
              <div>
                <label
                  htmlFor="category"
                  className="block text-lg font-bold text-zinc-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  <option value="" disabled>
                    Select a category...
                  </option>
                  {forSaleCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="e.g., 50.00"
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Location (Zip Code)
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    placeholder="e.g., 10001"
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-lg font-bold text-zinc-700 mb-2">
                  Delivery Method
                </label>
                <div className="flex items-center space-x-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={deliveryMethod === "pickup"}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                    <span className="ml-3 text-zinc-800">Pickup In-Person</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="shipping"
                      checked={deliveryMethod === "shipping"}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                    <span className="ml-3 text-zinc-800">Shipping</span>
                  </label>
                </div>
              </div>
              {deliveryMethod === "shipping" && (
                <div>
                  <label
                    htmlFor="shippingCost"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Shipping Cost (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="shippingCost"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    required={deliveryMethod === "shipping"}
                    placeholder="Enter shipping fee"
                    className="w-full md:w-1/2 px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
              )}
            </>
          )}

          {/* Service Flow */}
          {listingType === "service" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="serviceCategory"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Service Category
                  </label>
                  <select
                    id="serviceCategory"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="" disabled>
                      Select a category...
                    </option>
                    {serviceCategories.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Service Area (Zip Code)
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    placeholder="e.g., 10001"
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Rate (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="e.g., 50.00"
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rateType"
                    className="block text-lg font-bold text-zinc-700 mb-2"
                  >
                    Rate Type
                  </label>
                  <select
                    id="rateType"
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="flat fee">Flat Fee</option>
                    <option value="per hour">Per Hour</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-lg font-bold text-zinc-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
            ></textarea>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-lg font-bold text-zinc-700 mb-2">
              Attach Photos
            </label>
            <input
              type="file"
              id="photos"
              onChange={handlePhotoChange}
              multiple
              accept="image/*"
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo.preview}
                      alt={`preview ${index}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg disabled:bg-zinc-400 disabled:cursor-not-allowed"
            >
              {isLoading
                ? statusMessage
                : isEditing
                ? "Save Changes"
                : "Pay & Create Listing"}
            </button>
            <p className="text-sm text-zinc-600 mt-3">
              {isEditing
                ? "No fee is required to edit a listing."
                : `A fee of ~$${
                    listingType === "item" ? "5" : "20"
                  } (paid in whitelisted tokens) is required to create a listing.`}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;
