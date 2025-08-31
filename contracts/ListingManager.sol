// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol"; // <-- THIS LINE WAS ADDED
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IListingManager.sol";

contract ListingManager is Ownable, EIP712, IListingManager {
    using SafeERC20 for IERC20;

    // --- Events ---
    event ListingCreated(uint256 indexed listingId, address indexed owner, ListingType listingType, uint256 feePaid);
    event ListingDeleted(uint256 indexed listingId);
    event ListingClosed(uint256 indexed listingId);

    // --- State Variables ---
    ITreasury public immutable treasury;
    IERC20 public immutable feeToken; // The stablecoin used for listing fees (e.g., MockDAI)
    address public trustedSigner;
    
    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;
    mapping(bytes32 => bool) public usedSignatures;

    // Fees in USD with 8 decimals, e.g., $5.00 = 500_000_000
    uint256 public forSaleFee = 5 * 10**8; 
    uint256 public serviceFee = 20 * 10**8;

    bytes32 private constant SIGNATURE_TYPEHASH = keccak256(
        "CreateListing(address user,string dataIdentifier,uint256 nonce,uint256 deadline)"
    );

    constructor(
        address _treasury,
        address _feeToken,
        address _trustedSigner
    ) Ownable(msg.sender) EIP712("ListingManager", "1") {
        treasury = ITreasury(_treasury);
        feeToken = IERC20(_feeToken);
        trustedSigner = _trustedSigner;
    }

    // --- Core Functions ---
    function createListing(
        ListingType _type,
        uint256 _priceInUsd, // Price of the item/service in USD with 8 decimals
        string calldata _dataIdentifier,
        uint256 _nonce,
        uint256 _deadline,
        bytes calldata _signature
    ) external {
        bytes32 digest = _getSignatureHash(msg.sender, _dataIdentifier, _nonce, _deadline);
        _verifySignature(digest, _signature, _deadline);
        usedSignatures[digest] = true;

        uint256 fee = _type == ListingType.ForSale ? forSaleFee : serviceFee;
        
        uint256 feeInToken = _convertUsdToToken(fee, address(feeToken));
        
        feeToken.safeTransferFrom(msg.sender, address(treasury), feeInToken);

        _listingCounter++;
        uint256 newListingId = _listingCounter;
        listings[newListingId] = Listing({
            owner: msg.sender,
            priceInUsd: _priceInUsd,
            listingType: _type,
            status: ListingStatus.Active,
            dataIdentifier: _dataIdentifier
        });

        emit ListingCreated(newListingId, msg.sender, _type, feeInToken);
    }
    
    function deleteListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.owner == msg.sender, "ListingManager: Not your listing");
        require(listing.status == ListingStatus.Active, "ListingManager: Listing not active");
        
        delete listings[_listingId];
        emit ListingDeleted(_listingId);
    }
    
    // --- External Getters ---
    function getListing(uint256 listingId) external view override returns (Listing memory) {
        return listings[listingId];
    }
    
    // --- Restricted Functions (Called by PaymentProcessor) ---
    function closeListing(uint256 listingId) external override {
        // In a real system, you would restrict this to be callable only by the PaymentProcessor
        // For the alpha, this is left open but should be secured for production.
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "ListingManager: Listing not active");
        listing.status = ListingStatus.Inactive;
        emit ListingClosed(listingId);
    }

    // --- Admin Functions ---
    function setTrustedSigner(address _newSigner) external onlyOwner {
        trustedSigner = _newSigner;
    }
    
    function setFees(uint256 _forSaleFee, uint256 _serviceFee) external onlyOwner {
        forSaleFee = _forSaleFee;
        serviceFee = _serviceFee;
    }

    // --- Internal & View Functions ---
    function _getSignatureHash(address user, string calldata dataIdentifier, uint256 nonce, uint256 deadline) internal view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(
            SIGNATURE_TYPEHASH,
            user,
            keccak256(bytes(dataIdentifier)),
            nonce,
            deadline
        ));
        return _hashTypedDataV4(structHash);
    }

    function _verifySignature(bytes32 digest, bytes calldata signature, uint256 deadline) internal view {
        require(deadline >= block.timestamp, "ListingManager: Signature expired");
        require(!usedSignatures[digest], "ListingManager: Signature already used");
        
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == trustedSigner && recoveredSigner != address(0), "ListingManager: Invalid signature");
    }

    function _convertUsdToToken(uint256 usdAmount, address token) internal view returns (uint256) {
        // This is a simplified conversion assuming the token is a stablecoin pegged 1:1 to USD.
        // It calls the treasury to get the official "value" of 1 token, which for a stablecoin should be ~$1.
        // We calculate how many full tokens are needed to represent the USD value.
        uint256 oneToken = 10**IERC20Metadata(token).decimals();
        uint256 oneTokenInUsd = treasury.getCollateralTokenValue(oneToken, token); // This returns with 18 decimals
        require(oneTokenInUsd > 0, "ListingManager: Treasury cannot value fee token");

        // usdAmount is 8 decimals, oneTokenInUsd is 18 decimals.
        // We want to return an amount with `token` decimals.
        return (usdAmount * (10**18) * oneToken) / (oneTokenInUsd * (10**8));
    }
}