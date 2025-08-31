// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IListingManager.sol";
import "./interfaces/ILMKT.sol";

contract PaymentProcessor is ReentrancyGuard, Ownable {
    using SafeERC20 for ILMKT;

    // --- Events ---
    event PurchaseMade(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 lmktAmount);
    
    // --- Protocol Parameters ---
    uint256 public constant COMMERCE_FEE = 50; // 0.5% (50 / 10000)
    uint256 public constant FEE_BASE = 10000;

    // --- State Variables ---
    ITreasury public immutable treasury;
    IListingManager public immutable listingManager;
    ILMKT public immutable lmktToken;

    constructor(address _treasury, address _listingManager, address _lmktToken) Ownable(msg.sender) {
        treasury = ITreasury(_treasury);
        listingManager = IListingManager(_listingManager);
        lmktToken = ILMKT(_lmktToken);
    }

    // --- Core Functions ---
    function executePayment(uint256 listingId) external nonReentrant {
        IListingManager.Listing memory listing = listingManager.getListing(listingId);
        require(listing.status == IListingManager.ListingStatus.Active, "PaymentProcessor: Listing not active");
        require(listing.owner != msg.sender, "PaymentProcessor: Cannot buy your own listing");

        // Convert the listing's USD price to the required LMKT amount
        uint256 lmktPriceInUsd = treasury.getLmktPriceInUsd(); // Returns with 8 decimals
        require(lmktPriceInUsd > 0, "PaymentProcessor: Invalid LMKT price");
        
        uint256 itemPriceInLmkt = (listing.priceInUsd * (10**lmktToken.decimals())) / lmktPriceInUsd;

        // Calculate commerce fee and split it
        uint256 totalFeeInLmkt = (itemPriceInLmkt * COMMERCE_FEE) / FEE_BASE;
        uint256 treasuryShare = totalFeeInLmkt / 2;
        uint256 sellerBonus = totalFeeInLmkt - treasuryShare;

        uint256 sellerAmount = itemPriceInLmkt + sellerBonus;
        uint256 totalAmount = sellerAmount + treasuryShare;

        // Pull the total LMKT from the buyer
        lmktToken.safeTransferFrom(msg.sender, address(this), totalAmount);

        // Immediately send funds to seller and treasury (non-custodial)
        lmktToken.safeTransfer(listing.owner, sellerAmount);
        lmktToken.safeTransfer(address(treasury), treasuryShare);

        // Close the listing to prevent double-selling
        listingManager.closeListing(listingId);

        emit PurchaseMade(listingId, msg.sender, listing.owner, totalAmount);
    }
}