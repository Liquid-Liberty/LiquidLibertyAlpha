// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/ITreasury.sol";

contract ListingManager is Ownable, EIP712 {
    event ListingCreated(uint256 indexed listingId, address indexed owner, ListingType listingType, uint256 feePaid);
    event ListingDeleted(uint256 indexed listingId);

    enum ListingType { ForSale, ServiceOffered }

    struct Listing {
        address owner;
        uint256 expiresAt;
        ListingType listingType;
        string dataIdentifier;
    }

    uint256 public constant LISTING_DURATION = 30 days;
    bytes32 private constant LISTING_TYPEHASH = keccak256(
        "Listing(uint8 listingType,string dataIdentifier,address userAddress,uint256 feeInToken,uint256 deadline)"
    );

    ITreasury public treasury;
    IERC20 public paymentToken;
    address public trustedSigner;
    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;
    mapping(bytes32 => bool) public usedHashes;

    constructor(
        address _treasury,
        address _paymentToken,
        address _trustedSigner
    ) Ownable(msg.sender) EIP712("ListingManager", "1") {
        treasury = ITreasury(_treasury);
        paymentToken = IERC20(_paymentToken);
        trustedSigner = _trustedSigner;
    }

    function createListing(
        ListingType _type,
        string memory _dataIdentifier,
        uint256 _feeInToken,
        uint256 _deadline,
        bytes memory _signature
    ) external {
        bytes32 digest = getListingMessageHash(_type, _dataIdentifier, msg.sender, _feeInToken, _deadline);
        _verify(digest, _signature, _deadline);
        usedHashes[digest] = true;
        paymentToken.transferFrom(msg.sender, address(treasury), _feeInToken);
        _listingCounter++;
        uint256 newListingId = _listingCounter;
        listings[newListingId] = Listing({
            owner: msg.sender,
            expiresAt: block.timestamp + LISTING_DURATION,
            listingType: _type,
            dataIdentifier: _dataIdentifier
        });
        emit ListingCreated(newListingId, msg.sender, _type, _feeInToken);
    }

    // --- CORRECTED: Removed 'onlyOwner' and updated the require message ---
    function deleteListing(uint256 _listingId) external {
        require(listings[_listingId].owner == msg.sender, "ListingManager: Not your listing");
        delete listings[_listingId];
        emit ListingDeleted(_listingId);
    }

    function getListingMessageHash(ListingType _type, string memory _dataIdentifier, address _user, uint256 _feeInToken, uint256 _deadline) public view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(LISTING_TYPEHASH, uint8(_type), keccak256(bytes(_dataIdentifier)), _user, _feeInToken, _deadline));
        return _hashTypedDataV4(structHash);
    }

    function _verify(bytes32 _digest, bytes memory _signature, uint256 _deadline) private view {
        require(_deadline >= block.timestamp, "ListingManager: Signature expired");
        require(!usedHashes[_digest], "ListingManager: Signature already used");
        address recoveredSigner = ECDSA.recover(_digest, _signature);
        require(recoveredSigner == trustedSigner && recoveredSigner != address(0), "ListingManager: Invalid signature");
    }

    function setTrustedSigner(address _newSigner) external onlyOwner {
        trustedSigner = _newSigner;
    }
}