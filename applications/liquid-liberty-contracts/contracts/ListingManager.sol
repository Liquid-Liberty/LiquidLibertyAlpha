// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
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
    event ListingRenewed(uint256 indexed listingId, uint256 newExpiration);

    // --- State Variables ---
    ITreasury public immutable treasury;
    IERC20 public immutable feeToken;
    address public trustedSigner;
    address public paymentProcessor;

    uint256 public listingCounter;
    mapping(uint256 => Listing) public listings;
    mapping(bytes32 => bool) public usedSignatures;

    mapping(address => uint256[]) public listingsByOwner;
    mapping(uint256 => uint256) private _listingIdToIndex;
    mapping(uint256 => address) private _listingIdToOwner;

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

    function createListing(
        ListingType _type,
        uint256 _priceInUsd,
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

        listingCounter++;
        uint256 newListingId = listingCounter;
        listings[newListingId] = Listing({
            owner: msg.sender,
            priceInUsd: _priceInUsd,
            listingType: _type,
            status: ListingStatus.Active,
            dataIdentifier: _dataIdentifier,
            expirationTimestamp: block.timestamp + 30 days
        });

        listingsByOwner[msg.sender].push(newListingId);
        _listingIdToIndex[newListingId] = listingsByOwner[msg.sender].length - 1;
        _listingIdToOwner[newListingId] = msg.sender;

        emit ListingCreated(newListingId, msg.sender, _type, feeInToken);
    }
    
    function deleteListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.owner == msg.sender, "ListingManager: Not your listing");
        require(listing.status == ListingStatus.Active, "ListingManager: Listing not active");
        
        address ownerAddress = _listingIdToOwner[_listingId];
        uint256 indexToRemove = _listingIdToIndex[_listingId];
        uint256 lastIndex = listingsByOwner[ownerAddress].length - 1;
        uint256 lastListingId = listingsByOwner[ownerAddress][lastIndex];

        if (indexToRemove != lastIndex) {
            listingsByOwner[ownerAddress][indexToRemove] = lastListingId;
            _listingIdToIndex[lastListingId] = indexToRemove;
        }
        
        listingsByOwner[ownerAddress].pop();
        delete _listingIdToIndex[_listingId];
        delete _listingIdToOwner[_listingId];
        
        delete listings[_listingId];
        emit ListingDeleted(_listingId);
    }
    
    function renewListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.owner == msg.sender, "ListingManager: Not your listing");
        require(listing.status == ListingStatus.Active, "ListingManager: Listing not active");

        uint256 fee = listing.listingType == ListingType.ForSale ? forSaleFee : serviceFee;
        uint256 feeInToken = _convertUsdToToken(fee, address(feeToken));
        feeToken.safeTransferFrom(msg.sender, address(treasury), feeInToken);

        listing.expirationTimestamp = block.timestamp + 30 days;
        emit ListingRenewed(_listingId, listing.expirationTimestamp);
    }
    
    function getListing(uint256 listingId) external view override returns (Listing memory) {
        return listings[listingId];
    }
    
    function getListingsByOwner(address _owner) external view override returns (uint256[] memory) {
        return listingsByOwner[_owner];
    }

    function getActiveListings(uint256 _cursor, uint256 _limit) external view override returns (uint256[] memory listingIds, uint256 nextCursor) {
        uint256 maxId = listingCounter;
        if (_limit == 0 || maxId == 0) {
            return (new uint256[](0), 0);
        }
        uint256 startId = (_cursor == 0 || _cursor > maxId) ? maxId : _cursor;
        
        listingIds = new uint256[](_limit);
        uint256 count = 0;
        uint256 i = startId;

        while(i > 0 && count < _limit) {
            Listing storage item = listings[i];
            
            if (
                item.owner != address(0) &&
                item.status == ListingStatus.Active &&
                item.expirationTimestamp > block.timestamp
            ) {
                listingIds[count] = i;
                count++;
            }
            i--;
        }

        nextCursor = (i > 0) ? i : 0;
        
        assembly {
            mstore(listingIds, count)
        }

        return (listingIds, nextCursor);
    }
    
    function closeListing(uint256 listingId) external override {
        require(msg.sender == paymentProcessor, "LM: Caller is not the PaymentProcessor");
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "ListingManager: Listing not active");
        listing.status = ListingStatus.Inactive;
        emit ListingClosed(listingId);
    }

    function setPaymentProcessor(address _processor) external onlyOwner {
        paymentProcessor = _processor;
    }

    function setTrustedSigner(address _newSigner) external onlyOwner {
        trustedSigner = _newSigner;
    }
    
    function setFees(uint256 _forSaleFee, uint256 _serviceFee) external onlyOwner {
        forSaleFee = _forSaleFee;
        serviceFee = _serviceFee;
    }

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
        uint256 oneToken = 10**IERC20Metadata(token).decimals();
        uint256 oneTokenInUsd = treasury.getCollateralTokenValue(oneToken, token);
        require(oneTokenInUsd > 0, "ListingManager: Treasury cannot value fee token");

        return (usdAmount * (10**18) * oneToken) / (oneTokenInUsd * (10**8));
    }
}