// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IListingManager {
    // --- CHANGE: Using your preferred "ServiceOffered" enum name
    enum ListingType { ForSale, ServiceOffered }
    enum ListingStatus { Active, Inactive }

    struct Listing {
        address owner;
        uint256 priceInUsd;
        ListingType listingType;
        ListingStatus status;
        string dataIdentifier;
        // --- CHANGE: Added field to track listing expiration for the renewal feature
        uint256 expirationTimestamp;
    }

    function getListing(uint256 listingId) external view returns (Listing memory);
    function closeListing(uint256 listingId) external;
}