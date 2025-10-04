// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IListingManager {
    enum ListingType { ForSale, ServiceOffered }
    enum ListingStatus { Active, Inactive }

    struct Listing {
        address owner;
        uint256 priceInUsd;
        ListingType listingType;
        ListingStatus status;
        string dataIdentifier;
        uint256 expirationTimestamp;
    }

    function getListing(uint256 listingId) external view returns (Listing memory);
    function closeListing(uint256 listingId) external;

    // --- CHANGE: Added new view functions for dapp integration ---
    function getListingsByOwner(address _owner) external view returns (uint256[] memory);
    function getActiveListings(uint256 _cursor, uint256 _limit) external view returns (uint256[] memory listingIds, uint256 nextCursor);
}