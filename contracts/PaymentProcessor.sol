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

    event PurchaseMade(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 lmktAmount);
    
    uint256 public constant COMMERCE_FEE = 50; // 0.5% (50 / 10000)
    uint256 public constant FEE_BASE = 10000;

    ITreasury public immutable treasury;
    IListingManager public immutable listingManager;
    ILMKT public immutable lmktToken;

    constructor(address _treasury, address _listingManager, address _lmktToken) Ownable(msg.sender) {
        treasury = ITreasury(_treasury);
        listingManager = IListingManager(_listingManager);
        lmktToken = ILMKT(_lmktToken);
    }

    function executePayment(uint256 listingId, uint256 maxLmktToPay) external nonReentrant {
        IListingManager.Listing memory listing = listingManager.getListing(listingId);
        
        require(listing.expirationTimestamp > block.timestamp, "PaymentProcessor: Listing has expired");
        require(listing.status == IListingManager.ListingStatus.Active, "PaymentProcessor: Listing not active");
        require(listing.owner != msg.sender, "PaymentProcessor: Cannot buy your own listing");

        uint256 lmktPriceInUsd = treasury.getLmktPriceInUsd();
        require(lmktPriceInUsd > 0, "PaymentProcessor: Invalid LMKT price");
        
        uint256 itemPriceInLmkt = (listing.priceInUsd * (10**lmktToken.decimals())) / lmktPriceInUsd;

        uint256 totalFeeInLmkt = (itemPriceInLmkt * COMMERCE_FEE) / FEE_BASE;
        uint256 treasuryShare = totalFeeInLmkt / 2;
        uint256 sellerBonus = totalFeeInLmkt - treasuryShare;
        uint256 sellerAmount = itemPriceInLmkt + sellerBonus;
        uint256 totalAmount = sellerAmount + treasuryShare;

        require(totalAmount <= maxLmktToPay, "PaymentProcessor: Slippage tolerance exceeded");

        lmktToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        lmktToken.safeTransfer(listing.owner, sellerAmount);
        lmktToken.safeTransfer(address(treasury), treasuryShare);

        if (listing.listingType == IListingManager.ListingType.ForSale) {
            listingManager.closeListing(listingId);
        }

        emit PurchaseMade(listingId, msg.sender, listing.owner, totalAmount);
    }
}