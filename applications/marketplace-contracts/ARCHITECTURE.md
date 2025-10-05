# 🏗️ Smart Contracts Architecture

## System Overview

The Liquid Liberty smart contracts implement a decentralized marketplace with an integrated Automated Market Maker (AMM) for the LMKT token. The system consists of 5 core contracts working together to provide marketplace functionality with tokenomics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTIONS                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND DAPP                           │
│  - Web3 Wallet Connection (Wagmi)                           │
│  - Contract Interaction Layer                               │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                   SMART CONTRACTS LAYER                      │
│                                                              │
│  ┌─────────────┐      ┌──────────────┐    ┌──────────────┐ │
│  │   LMKT.sol  │◄─────┤ Treasury.sol │    │ Faucet.sol   │ │
│  │  (ERC20)    │      │    (AMM)     │    │ (Test Dist)  │ │
│  └─────────────┘      └──────┬───────┘    └──────────────┘ │
│         ▲                    │                              │
│         │                    │                              │
│         │                    ▼                              │
│  ┌──────┴────────────┐  ┌────────────────┐                 │
│  │ ListingManager    │◄─┤ PaymentProc.   │                 │
│  │  (Marketplace)    │  │  (Payments)    │                 │
│  └───────────────────┘  └────────────────┘                 │
│                                                              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼ (Events)
┌──────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN INDEXER                        │
│  - Listens to MKTSwap events                                │
│  - Creates OHLCV candle data                                │
│  - Provides GraphQL API                                     │
└──────────────────────────────────────────────────────────────┘
```

## Contract Flow Diagrams

### 1. LMKT Token Purchase Flow

```
User wants to buy LMKT tokens
         │
         ▼
┌─────────────────────┐
│ 1. User approves    │
│    mDAI spending    │
│    to Treasury      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 2. User calls Treasury.buyMkt()     │
│    - collateralAmount: 1000 mDAI    │
│    - collateralToken: mDAI address  │
│    - minLmktOut: slippage tolerance │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Treasury validates:               │
│    ✓ Collateral is whitelisted       │
│    ✓ Price feed exists               │
│    ✓ Amount > 0                      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Treasury calculates LMKT amount:  │
│    - Get collateral USD value        │
│    - Get current LMKT price          │
│    - Apply buy discount (1%)         │
│    - lmktAmount = collateralUSD /    │
│                   (price * 0.99)     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Check slippage:                   │
│    if (lmktAmount < minLmktOut)      │
│        revert "Slippage exceeded"    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. Transfer collateral from user     │
│    mDAI.transferFrom(user, Treasury) │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. Mint LMKT to user                 │
│    LMKT.mint(user, lmktAmount)       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 8. Emit MKTSwap event                │
│    - sender: user address            │
│    - collateralToken: mDAI           │
│    - collateralAmount: 1000          │
│    - lmktAmount: calculated          │
│    - totalCollateral: updated        │
│    - circulatingSupply: updated      │
│    - isBuy: true                     │
└──────────┬───────────────────────────┘
           │
           ▼
      [Success]
   User has LMKT tokens
```

### 2. LMKT Token Sale Flow

```
User wants to sell LMKT tokens
         │
         ▼
┌─────────────────────┐
│ 1. User approves    │
│    LMKT spending    │
│    to Treasury      │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. User calls Treasury.sellMkt()     │
│    - lmktAmount: 500 LMKT            │
│    - collateralToken: mDAI address   │
│    - minCollateralOut: slippage      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. Treasury validates:               │
│    ✓ Collateral is whitelisted       │
│    ✓ Price feed exists               │
│    ✓ Amount > 0                      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Calculate collateral payout:      │
│    - Get current LMKT price          │
│    - Apply sell premium (1%)         │
│    - collateralOut = lmktAmount *    │
│                      price * 1.01    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Check slippage:                   │
│    if (collateralOut < minOut)       │
│        revert "Slippage exceeded"    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. Check Treasury has enough:        │
│    if (balance < collateralOut)      │
│        revert "Insufficient reserves"│
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. Burn LMKT from user               │
│    LMKT.burn(user, lmktAmount)       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 8. Transfer collateral to user       │
│    mDAI.transfer(user, collateralOut)│
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 9. Emit MKTSwap event                │
│    - isBuy: false                    │
│    - updated reserves                │
└──────────┬───────────────────────────┘
           │
           ▼
      [Success]
   User has collateral (mDAI)
```

### 3. Marketplace Listing Creation Flow

```
User wants to create a listing
         │
         ▼
┌──────────────────────────────────────┐
│ 1. User uploads images to IPFS       │
│    via API serverless function       │
│    → Returns IPFS hash               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. User requests signature from API  │
│    POST /create-listing-signature    │
│    - listingType, dataIdentifier,    │
│      userAddress, feeInToken         │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. API generates EIP-712 signature   │
│    using trusted signer key          │
│    → Returns signature (v, r, s)     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. User approves LMKT fee to         │
│    ListingManager contract           │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. User calls                        │
│    ListingManager.createListing()    │
│    with signature                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. ListingManager validates:         │
│    ✓ Signature is from trusted       │
│    ✓ Deadline not expired            │
│    ✓ User has approved LMKT          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. Transfer LMKT fee to Treasury     │
│    LMKT.transferFrom(user, Treasury) │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 8. Create listing record             │
│    - Increment listing counter       │
│    - Store listing data              │
│    - Emit ListingCreated event       │
└──────────┬───────────────────────────┘
           │
           ▼
      [Success]
   Listing is live on marketplace
```

### 4. Marketplace Purchase Flow

```
Buyer wants to purchase a listing
         │
         ▼
┌──────────────────────────────────────┐
│ 1. Buyer approves payment token      │
│    (mDAI or LMKT) to                 │
│    PaymentProcessor                  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. Buyer calls                       │
│    PaymentProcessor.processPurchase()│
│    - listingId                       │
│    - paymentToken                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. PaymentProcessor validates:       │
│    ✓ Listing exists and active       │
│    ✓ Buyer has sufficient balance    │
│    ✓ Buyer has approved amount       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. Calculate payment distribution:   │
│    - Seller receives 95%             │
│    - Treasury receives 5% fee        │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. Transfer tokens:                  │
│    - Transfer to seller              │
│    - Transfer fee to Treasury        │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. Mark listing as purchased         │
│    ListingManager.markPurchased()    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. Emit PurchaseMade event           │
│    - listingId, buyer, seller, price │
└──────────┬───────────────────────────┘
           │
           ▼
      [Success]
   Purchase complete, seller paid
```

## Price Calculation Algorithm

### LMKT Price Determination

The LMKT price is dynamically calculated based on the Treasury's collateral reserves:

```
LMKT Price (USD) = Total Collateral Value (USD) / Circulating LMKT Supply

Example:
- Total Collateral: 10,000 mDAI = $10,000 USD
- Circulating LMKT: 1,000,000 tokens
- LMKT Price = $10,000 / 1,000,000 = $0.01 per LMKT

With Buy Discount (1%):
- Effective Buy Price = $0.01 * 0.99 = $0.0099

With Sell Premium (1%):
- Effective Sell Price = $0.01 * 1.01 = $0.0101
```

### Buy Amount Calculation

```solidity
function getLmktAmountForCollateral(
    uint256 collateralAmount,
    address collateralToken
) returns (uint256 lmktAmount) {
    // 1. Get collateral value in USD
    uint256 collateralUsdValue = getCollateralValueInUsd(
        collateralAmount,
        collateralToken
    );

    // 2. Get current LMKT price
    uint256 lmktPrice = getLmktPriceInUsd();

    // 3. Apply buy discount (1% off)
    uint256 discountedPrice = (lmktPrice * (SPREAD_BASE - BUY_DISCOUNT)) / SPREAD_BASE;

    // 4. Calculate LMKT tokens to mint
    lmktAmount = (collateralUsdValue * 10**LMKT_DECIMALS) / discountedPrice;
}
```

### Sell Payout Calculation

```solidity
function getCollateralAmountForLmkt(
    uint256 lmktAmount,
    address collateralToken
) returns (uint256 collateralAmount) {
    // 1. Get current LMKT price
    uint256 lmktPrice = getLmktPriceInUsd();

    // 2. Apply sell premium (1% fee)
    uint256 premiumPrice = (lmktPrice * (SPREAD_BASE + SELL_PREMIUM)) / SPREAD_BASE;

    // 3. Calculate USD value of LMKT
    uint256 lmktUsdValue = (lmktAmount * premiumPrice) / 10**LMKT_DECIMALS;

    // 4. Convert to collateral tokens
    collateralAmount = getCollateralFromUsd(lmktUsdValue, collateralToken);
}
```

## Security Mechanisms

### 1. Reentrancy Protection
```solidity
contract Treasury is ReentrancyGuard {
    function buyMkt(...) external nonReentrant {
        // Protected against reentrancy
    }
}
```

### 2. Access Control
```solidity
contract Treasury is Ownable {
    function setFeeRate(...) external onlyOwner {
        // Only owner can modify
    }
}
```

### 3. Slippage Protection
```solidity
function buyMkt(
    uint256 collateralAmount,
    address collateralToken,
    uint256 minLmktOut  // ← Slippage protection
) external {
    uint256 lmktAmount = calculateAmount(...);
    require(lmktAmount >= minLmktOut, "Slippage exceeded");
}
```

### 4. EIP-712 Signature Verification
```solidity
function createListing(..., bytes memory signature) external {
    bytes32 digest = _hashTypedDataV4(
        keccak256(abi.encode(...))
    );
    address signer = ECDSA.recover(digest, signature);
    require(signer == trustedSigner, "Invalid signature");
}
```

## Contract Interactions

### Treasury ↔ LMKT
- Treasury owns LMKT contract
- Treasury can mint/burn LMKT tokens
- LMKT ownership transferred on deployment

### ListingManager ↔ PaymentProcessor
- PaymentProcessor set as authorized in ListingManager
- PaymentProcessor can mark listings as purchased
- Fee routing from PaymentProcessor to Treasury

### All Contracts ↔ Price Oracle
- Treasury uses oracle for collateral pricing
- MockPriceOracle for testing
- Chainlink integration planned for production

## Event-Driven Architecture

All major contract actions emit events for off-chain indexing:

```solidity
// Treasury events
event MKTSwap(
    address indexed sender,
    address indexed collateralToken,
    uint256 collateralAmount,
    uint256 lmktAmount,
    uint256 totalCollateral,
    uint256 circulatingSupply,
    bool isBuy
);

// ListingManager events
event ListingCreated(
    uint256 indexed listingId,
    address indexed owner,
    uint8 listingType,
    uint256 feeInToken
);

// PaymentProcessor events
event PurchaseMade(
    uint256 indexed listingId,
    address indexed buyer,
    address indexed seller,
    uint256 amount
);
```

These events are consumed by the indexer application to create:
- OHLCV price charts
- Marketplace activity tracking
- Volume analytics

## Gas Optimization

1. **Storage Packing**: Related variables packed in same slot
2. **Minimal Storage**: Use events for historical data
3. **Efficient Loops**: Avoid unbounded loops
4. **SafeERC20**: Optimized token transfers
5. **View Functions**: Off-chain calculations where possible

## Upgrade Strategy

Current deployment uses non-upgradeable contracts for:
- Transparency
- Security
- Simplicity

For future upgrades:
- Deploy new contract versions
- Migrate liquidity/state via governance
- Update frontend configuration
- Consider proxy patterns (UUPS, Transparent)
