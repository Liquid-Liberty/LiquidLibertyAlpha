// src/context/ListingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { contracts } from "../config/contracts"; // unified config for ABIs + addresses
import { getBackendSignature } from "../utils/backend"; // helper for Netlify signature API

const ListingsContext = createContext();

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);

  // --- Load listings from contract ---
  const loadListings = async () => {
    try {
      const { ListingManager } = contracts;
      const count = await ListingManager.listingCounter();
      const all = [];
      for (let i = 1; i <= count; i++) {
        const listing = await ListingManager.getListing(i);

        // 0 = Active, 1 = Inactive
        if (Number(listing.status) === 0) {
          all.push({
            id: i,
            owner: listing.owner,
            priceInUsd: Number(listing.priceInUsd), // NEW field
            type: Number(listing.listingType),
            status: Number(listing.status),
            dataIdentifier: listing.dataIdentifier,
          });
        }
      }
      setListings(all);
    } catch (err) {
      console.error("Error loading listings:", err);
    }
  };

  // --- Create Listing ---
  const createListing = async (type, priceInUsd, dataIdentifier, userAddress) => {
    try {
      const nonce = Date.now(); // could also use counter from backend
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

      // Get typed-data signature from backend signer (Netlify fn)
      const { signature } = await getBackendSignature({
        user: userAddress,
        dataIdentifier,
        nonce,
        deadline,
      });

      const { ListingManager } = contracts;
      const tx = await ListingManager.createListing(
        type,
        priceInUsd,
        dataIdentifier,
        nonce,
        deadline,
        signature
      );
      await tx.wait();
      await loadListings();
    } catch (err) {
      console.error("Error creating listing:", err);
      throw err;
    }
  };

  // --- Renew Listing ---
  const renewListing = async (id, deadline, signature) => {
    try {
      const { ListingManager } = contracts;
      const tx = await ListingManager.renewListing(id, deadline, signature);
      await tx.wait();
      await loadListings();
    } catch (err) {
      console.error("Error renewing listing:", err);
      throw err;
    }
  };

  // --- Close Listing (normally called by PaymentProcessor) ---
  const closeListing = async (id) => {
    try {
      const { ListingManager } = contracts;
      const tx = await ListingManager.closeListing(id);
      await tx.wait();
      await loadListings();
    } catch (err) {
      console.error("Error closing listing:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  return (
    <ListingsContext.Provider
      value={{ listings, createListing, renewListing, closeListing, loadListings }}
    >
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => useContext(ListingsContext);
