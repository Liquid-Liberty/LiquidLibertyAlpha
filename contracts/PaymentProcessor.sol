// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ITreasury.sol";

contract PaymentProcessor is ReentrancyGuard, Ownable {
    // --- Events ---
    event PurchaseMade(uint256 indexed listingId, address indexed buyer, uint256 totalAmount);
    event FundsReleased(uint256 indexed listingId, address indexed seller, uint256 sellerAmount);
    
    // --- Structs ---
    struct Escrow {
        address buyer;
        address seller;
        uint256 totalAmount; // Total LMKT including item price and fee
        bool fundsReleased;
    }

    // --- Protocol Parameters ---
    uint256 public constant COMMERCE_FEE = 50; // 0.5% (50 / 10000)
    uint256 public constant FEE_BASE = 10000;

    // --- State Variables ---
    address public immutable treasury;
    address public immutable lmktToken;
    mapping(uint256 => Escrow) public escrows;

    constructor(address _treasury, address _lmktToken) Ownable(msg.sender) {
        treasury = _treasury;
        lmktToken = _lmktToken;

        // ** THE FIX IS HERE: Grant the Treasury an infinite approval to pull fee payments **
        IERC20(_lmktToken).approve(_treasury, type(uint256).max);
    }

    // --- Core Functions ---

    function makePurchase(uint256 listingId, uint256 price, address seller) external nonReentrant {
        // A full implementation would link to a listing management system
        // to verify the price and seller address.
        
        uint256 totalFee = (price * COMMERCE_FEE) / FEE_BASE;
        uint256 totalAmount = price + totalFee;

        escrows[listingId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            totalAmount: totalAmount,
            fundsReleased: false
        });

        IERC20(lmktToken).transferFrom(msg.sender, address(this), totalAmount);

        emit PurchaseMade(listingId, msg.sender, totalAmount);
    }

    function releaseFunds(uint256 listingId) external nonReentrant {
        Escrow storage escrow = escrows[listingId];
        require(msg.sender == escrow.buyer, "PaymentProcessor: Only buyer can release funds");
        require(!escrow.fundsReleased, "PaymentProcessor: Funds already released");

        escrow.fundsReleased = true;

        uint256 totalAmount = escrow.totalAmount;
        uint256 price = (totalAmount * FEE_BASE) / (FEE_BASE + COMMERCE_FEE);
        uint256 totalFee = totalAmount - price;

        uint256 treasuryShare = totalFee / 2;
        uint256 sellerShare = totalFee - treasuryShare;
        uint256 sellerAmount = price + sellerShare;

        // The Treasury will now be able to pull its fee share successfully.
        ITreasury(treasury).depositCommerceFee(lmktToken, treasuryShare);

        // Send the item price plus the other half of the fee to the seller
        IERC20(lmktToken).transfer(escrow.seller, sellerAmount);

        emit FundsReleased(listingId, escrow.seller, sellerAmount);
    }
}
