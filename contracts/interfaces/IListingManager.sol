// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IListingManager {
    enum ListingType { ForSale, ServiceOffered }
    enum ListingStatus { Active, Inactive }

    struct Listing {
        address owner;
        uint256 priceInUsd; // Price in USD with 8 decimals
        ListingType listingType;
        ListingStatus status;
        string dataIdentifier;
    }

    function getListing(uint256 listingId) external view returns (Listing memory);
    function closeListing(uint256 listingId) external;
}