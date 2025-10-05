# 🏗️ Blockchain Indexer Architecture

## System Overview

The Liquid Liberty Blockchain Indexer is a data processing service that listens to smart contract events, transforms them into structured data, and provides a GraphQL API for querying. It supports both The Graph and SubQuery indexing frameworks.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                          │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐       │
│  │  Treasury  │  │   Payment   │  │    Listing     │       │
│  │ Contract   │  │  Processor  │  │    Manager     │       │
│  └─────┬──────┘  └──────┬──────┘  └────────┬───────┘       │
│        │                │                   │                │
│        ▼                ▼                   ▼                │
│   MKTSwap         PurchaseMade      ListingCreated          │
│    Events            Events              Events             │
└─────────┬─────────────────┬────────────────┬────────────────┘
          │                 │                │
          ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    INDEXER SERVICE                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Event Listening Layer                    │  │
│  │  - Subscribes to blockchain events                    │  │
│  │  - Fetches block data                                 │  │
│  │  - Tracks indexing progress                           │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Mapping Handlers                         │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │ handleMKTSwap│  │handlePurchase│  │handleListing│ │  │
│  │  │              │  │              │  │            │ │  │
│  │  │ • Parse event│  │ • Extract data│  │• Store listing│  │
│  │  │ • Calc price │  │ • Record sale │  │  metadata  │ │  │
│  │  │ • Update OHLCV│ │ • Update stats│  │• Track fees │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Storage Layer                       │  │
│  │                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │ Candles │  │  Swaps  │  │Listings │  │Analytics│ │  │
│  │  │ (OHLCV) │  │  Table  │  │  Table  │  │  Table  │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  │                                                       │  │
│  │           PostgreSQL / IPFS Storage                   │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              GraphQL API Layer                        │  │
│  │  - Query resolver                                     │  │
│  │  - Pagination                                         │  │
│  │  - Filtering & sorting                                │  │
│  │  - Subscriptions (real-time)                          │  │
│  └─────────────────────┬────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONSUMERS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │  Analytics   │  │   API        │      │
│  │    DApp      │  │  Dashboard   │  │  Functions   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Event Processing Flow

### 1. MKTSwap Event Processing (Price Charts)

```
Treasury Contract emits MKTSwap event
         │
         ▼
┌─────────────────────────────────────┐
│ Event arrives at indexer            │
│                                     │
│ MKTSwap {                           │
│   sender: 0x123...                  │
│   collateralToken: 0xabc...         │
│   collateralAmount: 1000e18         │
│   lmktAmount: 100000e18             │
│   totalCollateral: 50000e18         │
│   circulatingSupply: 5000000e18     │
│   isBuy: true                       │
│ }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ handleMKTSwap mapping function       │
│                                      │
│ 1. Calculate price                   │
│    price = totalCollateral /         │
│            circulatingSupply         │
│    = 50000 / 5000000 = 0.01         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 2. Extract swap data                 │
│    - timestamp                       │
│    - volume (collateralAmount)       │
│    - direction (isBuy)               │
│    - transaction hash                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 3. Create Swap entity                │
│                                      │
│ Swap.create({                        │
│   id: txHash,                        │
│   timestamp: blockTimestamp,         │
│   sender: event.sender,              │
│   price: 0.01,                       │
│   volume: 1000,                      │
│   isBuy: true                        │
│ })                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 4. Update OHLCV candles              │
│                                      │
│ For each interval: [60, 300, 900,   │
│ 3600, 14400, 86400] seconds          │
│                                      │
│ updateCandle(swap, interval)         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 5. Update/Create Candle              │
│                                      │
│ bucketStart = floor(timestamp/       │
│               interval) * interval   │
│                                      │
│ IF candle exists:                    │
│   - Update high if price > high      │
│   - Update low if price < low        │
│   - Set close = current price        │
│   - Add to volume                    │
│   - Increment trades                 │
│                                      │
│ ELSE create new:                     │
│   - open = close = high = low = price│
│   - volume = swap volume             │
│   - trades = 1                       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 6. Save to database                  │
│    - Swap entity saved               │
│    - 6 Candle entities updated/      │
│      created (one per interval)      │
└──────────────┬───────────────────────┘
               │
               ▼
        [Event Processed]
   Data available via GraphQL
```

### 2. Marketplace Purchase Event Processing

```
PaymentProcessor emits PurchaseMade event
         │
         ▼
┌─────────────────────────────────────┐
│ Event arrives at indexer            │
│                                     │
│ PurchaseMade {                      │
│   listingId: 42                     │
│   buyer: 0x456...                   │
│   seller: 0x789...                  │
│   amount: 500e18                    │
│ }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ handlePurchaseMade mapping           │
│                                      │
│ 1. Load listing entity               │
│    listing = await Listing.get(      │
│      listingId.toString()            │
│    )                                 │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 2. Update listing status             │
│    listing.isPurchased = true        │
│    listing.buyer = buyer             │
│    listing.salePrice = amount        │
│    listing.saleTimestamp = now       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 3. Create Purchase entity            │
│                                      │
│ Purchase.create({                    │
│   id: txHash,                        │
│   listingId: 42,                     │
│   buyer: 0x456...,                   │
│   seller: 0x789...,                  │
│   amount: 500,                       │
│   timestamp: blockTimestamp          │
│ })                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 4. Update marketplace stats          │
│    - Total sales volume              │
│    - Sales count                     │
│    - Active listings count (-1)      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 5. Check for LMKT volume             │
│                                      │
│    IF paymentToken == LMKT:          │
│      - This counts as LMKT volume    │
│      - May affect LMKT price         │
│      - Update volume metrics         │
└──────────────┬───────────────────────┘
               │
               ▼
        [Event Processed]
   Listing marked as sold
```

### 3. Listing Creation Event Processing

```
ListingManager emits ListingCreated event
         │
         ▼
┌─────────────────────────────────────┐
│ Event arrives at indexer            │
│                                     │
│ ListingCreated {                    │
│   listingId: 42                     │
│   owner: 0xabc...                   │
│   listingType: 0 (item)             │
│   feeInToken: 10e18                 │
│ }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ handleListingCreated mapping         │
│                                      │
│ 1. Fetch listing details from        │
│    contract (if needed)              │
│    - dataIdentifier (IPFS hash)      │
│    - listing metadata                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 2. Create Listing entity             │
│                                      │
│ Listing.create({                     │
│   id: listingId.toString(),          │
│   owner: owner,                      │
│   listingType: type,                 │
│   dataIdentifier: ipfsHash,          │
│   feeInToken: 10,                    │
│   timestamp: blockTimestamp,         │
│   isPurchased: false,                │
│   isActive: true                     │
│ })                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 3. Update marketplace stats          │
│    - Total listings count            │
│    - Active listings count           │
│    - Fee revenue tracking            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 4. Track LMKT fee as volume          │
│    (feeInToken burned/transferred)   │
│                                      │
│    This may be indexed as:           │
│    - Treasury fee revenue            │
│    - LMKT deflationary event         │
└──────────────┬───────────────────────┘
               │
               ▼
        [Event Processed]
   New listing available
```

## OHLCV Candle Generation Algorithm

### Time Bucket Calculation

```typescript
function calculateBucket(timestamp: number, interval: number): number {
  // Round down to nearest interval
  return Math.floor(timestamp / interval) * interval;
}

// Example:
// timestamp = 1634567890 (Unix timestamp)
// interval = 3600 (1 hour)
// bucketStart = floor(1634567890 / 3600) * 3600
//             = floor(454046.36) * 3600
//             = 454046 * 3600
//             = 1634565600 (start of that hour)
```

### Candle Update Logic

```typescript
async function updateCandle(
  swap: Swap,
  interval: number
): Promise<void> {
  const bucketStart = calculateBucket(swap.timestamp, interval);
  const candleId = `${bucketStart}-${interval}`;

  // Try to load existing candle
  let candle = await Candle.get(candleId);

  if (!candle) {
    // First trade in this time bucket - create new candle
    candle = Candle.create({
      id: candleId,
      timestamp: BigInt(bucketStart),
      interval: interval.toString(),
      open: swap.price,      // First price is open
      high: swap.price,      // Also high
      low: swap.price,       // Also low
      close: swap.price,     // Also close
      volume: swap.volume,   // First volume
      trades: 1              // First trade
    });
  } else {
    // Update existing candle
    // Open stays the same (first price in bucket)
    candle.high = max(candle.high, swap.price);
    candle.low = min(candle.low, swap.price);
    candle.close = swap.price;  // Latest price is close
    candle.volume = candle.volume + swap.volume;
    candle.trades = candle.trades + 1;
  }

  await candle.save();
}
```

### Multi-Interval Processing

```typescript
// Process swap for all time intervals
const INTERVALS = [60, 300, 900, 3600, 14400, 86400];

for (const interval of INTERVALS) {
  await updateCandle(swap, interval);
}

// Result: One swap updates 6 candles
// - 1 minute candle
// - 5 minute candle
// - 15 minute candle
// - 1 hour candle
// - 4 hour candle
// - 1 day candle
```

## Data Storage Schema

### Entity Relationships

```
┌─────────────┐
│   Candle    │
│  (OHLCV)    │
│             │
│ • timestamp │
│ • interval  │◄──────┐
│ • open      │       │
│ • high      │       │ Aggregated from
│ • low       │       │
│ • close     │       │
│ • volume    │       │
│ • trades    │       │
└─────────────┘       │
                      │
┌─────────────┐       │
│    Swap     │───────┘
│             │
│ • id        │
│ • timestamp │
│ • sender    │
│ • price     │
│ • volume    │
│ • isBuy     │
└──────┬──────┘
       │
       │ May trigger
       ▼
┌─────────────┐
│  Purchase   │
│             │
│ • id        │
│ • listingId │─────┐
│ • buyer     │     │
│ • seller    │     │ References
│ • amount    │     │
│ • timestamp │     │
└─────────────┘     │
                    │
┌─────────────┐     │
│   Listing   │◄────┘
│             │
│ • id        │
│ • owner     │
│ • type      │
│ • ipfsHash  │
│ • fee       │
│ • purchased │
│ • active    │
└─────────────┘
```

## Network-Specific Configuration

### Build-Time Network Selection

```typescript
// project.ts configuration
const BUILD_NETWORK = process.env.BUILD_NETWORK;

// Fail fast if not specified
if (!BUILD_NETWORK) {
  throw new Error("BUILD_NETWORK must be set");
}

// Load network config
const config = {
  sepolia: {
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/...",
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    lmkt: "0x2a2DfFe954225D6511740a0cc8ec92b944ca9181",
    chainId: "11155111",
    startBlock: 9229814
  },
  pulse: {
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    treasury: "0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2",
    lmkt: "0x39B691Dc0E7AeB1DaA0291d9F561b9b75e2ECd8d",
    chainId: "943",
    startBlock: 22662405
  }
}[BUILD_NETWORK];
```

### Multi-Network Deployment Strategy

```
1. Build Sepolia version
   BUILD_NETWORK=sepolia npm run build:sepolia
   → Creates dist/ with Sepolia config embedded

2. Publish Sepolia
   npm run publish:sepolia
   → Uploads to IPFS, gets CID: QmSepolia...

3. Deploy on OnFinality
   → Use CID QmSepolia... for Sepolia deployment

4. Build Pulse version
   BUILD_NETWORK=pulse npm run build:pulse
   → Creates dist/ with Pulse config embedded

5. Publish Pulse
   npm run publish:pulse
   → Uploads to IPFS, gets CID: QmPulse...

6. Deploy on OnFinality
   → Use CID QmPulse... for Pulse deployment
```

## GraphQL API Layer

### Query Resolution Flow

```
Frontend sends GraphQL query
         │
         ▼
┌─────────────────────────────────────┐
│ GraphQL Server receives request     │
│                                     │
│ query {                             │
│   candles(                          │
│     interval: "3600"                │
│     first: 100                      │
│     orderBy: timestamp              │
│     orderDirection: desc            │
│   ) {                               │
│     timestamp                       │
│     open                            │
│     high                            │
│     low                             │
│     close                           │
│     volume                          │
│   }                                 │
│ }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Parse and validate query             │
│ - Check schema compliance            │
│ - Validate field access              │
│ - Apply authorization (if any)       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Build database query                 │
│                                      │
│ SELECT * FROM candles                │
│ WHERE interval = '3600'              │
│ ORDER BY timestamp DESC              │
│ LIMIT 100                            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Execute query on PostgreSQL          │
│ - Fetch candles from DB              │
│ - Apply indexes for performance      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Transform results                    │
│ - Convert DB types to GraphQL types  │
│ - Format BigInt, Decimal fields      │
│ - Apply field selections             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Return JSON response                 │
│                                      │
│ {                                    │
│   "data": {                          │
│     "candles": [                     │
│       {                              │
│         "timestamp": "1634565600",   │
│         "open": "0.0100",            │
│         "high": "0.0102",            │
│         "low": "0.0099",             │
│         "close": "0.0101",           │
│         "volume": "15000.50"         │
│       },                             │
│       ...                            │
│     ]                                │
│   }                                  │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
        Frontend receives data
     Renders TradingView chart
```

## Performance Optimizations

### Database Indexes

```sql
-- Candles table
CREATE INDEX idx_candles_interval_timestamp
  ON candles(interval, timestamp DESC);

CREATE INDEX idx_candles_timestamp
  ON candles(timestamp DESC);

-- Swaps table
CREATE INDEX idx_swaps_timestamp
  ON swaps(timestamp DESC);

CREATE INDEX idx_swaps_sender
  ON swaps(sender);

-- Listings table
CREATE INDEX idx_listings_owner
  ON listings(owner);

CREATE INDEX idx_listings_active
  ON listings(isActive, timestamp DESC);
```

### Caching Strategy

```
1. Query Results Cache
   - Cache frequent queries (recent candles)
   - TTL: 30 seconds for live data
   - Invalidate on new events

2. Entity Cache
   - Hot entities kept in memory
   - LRU eviction policy
   - Reduce DB reads

3. Block Cache
   - Cache processed block numbers
   - Prevent re-processing
   - Checkpoint system
```

### Batching

```typescript
// Process multiple events in single transaction
async function processBatch(events: Event[]): Promise<void> {
  const tx = await db.beginTransaction();

  try {
    for (const event of events) {
      await processEvent(event);
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
```

## Monitoring & Debugging

### Health Metrics

```
- Indexing Progress: Current block / Latest block
- Event Processing Rate: Events per second
- Query Performance: Average query time
- Error Rate: Errors per minute
- Storage Growth: Database size trend
```

### Logging

```typescript
logger.info("Processing MKTSwap event", {
  txHash: event.transactionHash,
  blockNumber: event.blockNumber,
  price: calculatedPrice,
  volume: swapVolume
});

logger.error("Failed to process event", {
  error: error.message,
  event: event,
  stack: error.stack
});
```

## Disaster Recovery

### Checkpoint System

```
Every 1000 blocks:
1. Save checkpoint
   - Block number
   - State hash
   - Timestamp

2. Backup database
   - PostgreSQL dump
   - IPFS backup

3. Verify integrity
   - Compare state hashes
   - Validate candle data
```

### Reorg Handling

```
1. Monitor chain reorganizations
2. Rollback affected blocks
3. Re-index from safe checkpoint
4. Invalidate affected queries
5. Notify consumers of reorg
```
