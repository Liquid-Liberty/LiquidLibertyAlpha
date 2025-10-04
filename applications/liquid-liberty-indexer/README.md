# 📊 Liquid Liberty Blockchain Indexer

A blockchain indexing service that processes events from Liquid Liberty smart contracts to provide OHLCV (Open, High, Low, Close, Volume) chart data and marketplace analytics via GraphQL API. Supports both The Graph and SubQuery implementations.

## 📋 Overview

This standalone indexer application listens to blockchain events and transforms them into queryable data structures for:

- **Price Charts**: OHLCV candlestick data for TradingView charts
- **Trading Analytics**: Volume, trades, liquidity tracking
- **Marketplace Events**: Listing creation, purchases, activity feed
- **Historical Data**: Complete transaction history

## 🏗️ Architecture

The indexer includes **two implementation options**:

### 1. SubQuery Indexer (Recommended)
- **Location**: `subgraph/lmkt-subquery/`
- **Network Support**: Sepolia, Pulse, Local
- **Deployment**: OnFinality hosted service
- **Features**: Multi-network builds, type-safe TypeScript

### 2. The Graph Indexer
- **Location**: `subgraph/`
- **Network Support**: Ethereum networks
- **Deployment**: The Graph hosted service / decentralized network
- **Features**: AssemblyScript mappings, mature ecosystem

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or later
- Docker (for local development)
- The Graph CLI: `npm install -g @graphprotocol/graph-cli`
- SubQuery CLI: `npm install -g @subql/cli`

### Installation

```bash
# Install dependencies
npm install

# Install SubQuery dependencies
cd subgraph/lmkt-subquery && npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

## 📊 SubQuery Indexer (Primary)

### Build & Deploy

```bash
# Build for Sepolia
npm run subquery:build:sepolia

# Build for Pulse
npm run subquery:build:pulse

# Build for Local development
npm run subquery:build:local

# Publish to OnFinality
npm run subquery:publish:sepolia
npm run subquery:publish:pulse
```

### Local Development

```bash
# Start local SubQuery node with Docker
npm run subquery:start:docker

# Or build and start
npm run subquery:dev:docker

# Access GraphQL playground
# http://localhost:3000
```

### Configuration

The SubQuery indexer uses `project.ts` for dynamic configuration:

```typescript
// Build-time network detection
const BUILD_TIME_NETWORK = process.env.BUILD_NETWORK;

// Network-specific configuration
const config = {
  sepolia: {
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/...",
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    chainId: "11155111",
    startBlock: 9229814,
  },
  pulse: {
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    treasury: "0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2",
    chainId: "943",
    startBlock: 22662405,
  }
};
```

### Event Handlers

Located in `subgraph/lmkt-subquery/src/mappings/`:

1. **handleMKTSwap** - Treasury swap events
   - Creates OHLCV candles
   - Tracks price changes
   - Records volume

2. **handlePurchaseMade** - Marketplace purchases
   - Tracks sales volume
   - Records buyer/seller
   - Marketplace analytics

3. **handleListingCreated** - New listings
   - Indexes listing data
   - Tracks listing fees
   - Activity feed

## 📈 The Graph Indexer (Alternative)

### Build & Deploy

```bash
# Generate code from schema
npm run graph:codegen

# Build subgraph
npm run graph:build

# Deploy to hosted service
npm run graph:deploy:hosted

# Or deploy to local node
npm run graph:create:local
npm run graph:deploy:local
```

### Local Graph Node

```bash
# Start local Graph node with Docker
cd subgraph
docker-compose up -d

# Create subgraph
npm run graph:create:local

# Deploy
npm run graph:deploy:local
```

## 📊 Data Schema

### OHLCV Candles

```graphql
type Candle @entity {
  id: ID!                    # timestamp-interval
  timestamp: BigInt!         # Unix timestamp
  interval: String!          # "60", "300", "3600", "86400"
  open: BigDecimal!          # Opening price
  high: BigDecimal!          # Highest price
  low: BigDecimal!           # Lowest price
  close: BigDecimal!         # Closing price
  volume: BigDecimal!        # Trading volume
  trades: Int!               # Number of trades
}
```

### Swap Events

```graphql
type Swap @entity {
  id: ID!                    # Transaction hash
  timestamp: BigInt!
  sender: String!
  collateralToken: String!
  collateralAmount: BigInt!
  lmktAmount: BigInt!
  isBuy: Boolean!
  price: BigDecimal!
}
```

### Marketplace Listings

```graphql
type Listing @entity {
  id: ID!                    # Listing ID
  owner: String!
  listingType: Int!
  dataIdentifier: String!    # IPFS hash
  feeInToken: BigInt!
  timestamp: BigInt!
  isPurchased: Boolean!
}
```

## 🔍 GraphQL Queries

### Get Recent Candles

```graphql
{
  candles(
    first: 100
    orderBy: timestamp
    orderDirection: desc
    where: { interval: "3600" }
  ) {
    timestamp
    open
    high
    low
    close
    volume
    trades
  }
}
```

### Get Recent Swaps

```graphql
{
  swaps(
    first: 20
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    sender
    isBuy
    lmktAmount
    collateralAmount
    price
    timestamp
  }
}
```

### Get Active Listings

```graphql
{
  listings(
    where: { isPurchased: false }
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    owner
    listingType
    dataIdentifier
    feeInToken
  }
}
```

## 🌐 Network Configuration

### Supported Networks

| Network | Chain ID | RPC URL | Start Block |
|---------|----------|---------|-------------|
| Sepolia | 11155111 | https://eth-sepolia.g.alchemy.com/v2/... | 9229814 |
| Pulse Testnet | 943 | https://rpc.v4.testnet.pulsechain.com | 22662405 |
| Localhost | 31337 | http://localhost:8545 | 0 |

### Updating Contract Addresses

Contract addresses are automatically synced from the contracts deployment via `scripts/sync-addresses.js`. Manual update:

1. Edit `subgraph/lmkt-subquery/project.ts`
2. Update addresses in the config object
3. Rebuild: `npm run subquery:build:sepolia`
4. Redeploy: `npm run subquery:publish:sepolia`

## 🔄 Data Flow

```
Smart Contracts (Treasury, PaymentProcessor, ListingManager)
         │
         ▼ (Emit Events)
    Blockchain
         │
         ▼ (Listen)
   Indexer Service
         │
         ▼ (Process)
   Mapping Handlers
         │
         ▼ (Store)
   PostgreSQL Database
         │
         ▼ (Query)
   GraphQL API
         │
         ▼ (Consume)
   Frontend DApp
```

## 🛠️ Development

### Adding New Event Handlers

1. Update `schema.graphql`:
```graphql
type NewEntity @entity {
  id: ID!
  field1: String!
  timestamp: BigInt!
}
```

2. Add handler in mappings:
```typescript
export async function handleNewEvent(event: NewEventLog): Promise<void> {
  const entity = NewEntity.create({
    id: event.transactionHash,
    field1: event.args.value,
    timestamp: BigInt(event.block.timestamp)
  });
  await entity.save();
}
```

3. Update `project.ts` datasources:
```typescript
{
  kind: EthereumHandlerKind.Event,
  handler: "handleNewEvent",
  filter: {
    topics: ["NewEvent(...)"]
  }
}
```

4. Rebuild and redeploy

### Testing Locally

```bash
# Start local node
npm run subquery:start:docker

# In another terminal, run test queries
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ candles { id timestamp } }"}'
```

## 📈 OHLCV Candle Generation

The indexer automatically creates candles for multiple time intervals:

- **1 minute** (60s) - High-frequency trading
- **5 minutes** (300s) - Short-term analysis
- **15 minutes** (900s) - Medium-term trends
- **1 hour** (3600s) - Hourly charts
- **4 hours** (14400s) - Daily overview
- **1 day** (86400s) - Long-term trends

Algorithm:
```typescript
function updateCandle(swap: Swap, interval: string) {
  const bucketStart = Math.floor(swap.timestamp / interval) * interval;
  const candleId = `${bucketStart}-${interval}`;

  let candle = await Candle.get(candleId);

  if (!candle) {
    // First trade in this bucket
    candle = Candle.create({
      id: candleId,
      open: swap.price,
      high: swap.price,
      low: swap.price,
      close: swap.price,
      volume: swap.volume,
      trades: 1
    });
  } else {
    // Update existing candle
    candle.high = max(candle.high, swap.price);
    candle.low = min(candle.low, swap.price);
    candle.close = swap.price;
    candle.volume += swap.volume;
    candle.trades += 1;
  }

  await candle.save();
}
```

## 🔗 Integration with Other Apps

### Contracts Integration
- Listens to events emitted by smart contracts
- Automatically syncs contract addresses on deployment
- Requires ABI files from contracts app

### Frontend Integration
- Provides GraphQL API endpoint for chart data
- Frontend queries candles for TradingView charts
- Real-time updates via subscriptions (if enabled)

### API Integration
- API functions may query indexer for validation
- Marketplace statistics from indexed data

## 🚀 Deployment

### OnFinality (SubQuery)

1. Build for target network:
```bash
npm run subquery:build:sepolia
```

2. Publish to IPFS:
```bash
npm run subquery:publish:sepolia
```

3. Copy the CID from output

4. Go to [OnFinality Dashboard](https://onfinality.io)
   - Create/update deployment
   - Paste the CID
   - Deploy

5. Get your GraphQL endpoint:
```
https://api.subquery.network/sq/your-project/your-deployment
```

### The Graph Hosted Service

1. Authenticate:
```bash
graph auth --product hosted-service YOUR_ACCESS_TOKEN
```

2. Deploy:
```bash
npm run graph:deploy:hosted
```

3. Get your endpoint:
```
https://api.thegraph.com/subgraphs/name/your-username/your-subgraph
```

## 🐛 Troubleshooting

### Indexing Not Starting
- Check contract addresses in `project.ts`
- Verify RPC endpoint is accessible
- Ensure start block is correct

### Missing Events
- Verify events are being emitted on blockchain
- Check event signatures match contract ABI
- Review mapping handler logic

### Query Errors
- Validate GraphQL schema syntax
- Check entity relationships
- Ensure all required fields are populated

## 📊 Monitoring

### SubQuery Metrics
- Indexing progress
- Block height
- Query performance
- Error logs

### Health Checks
```bash
# Check indexer status
curl http://localhost:3000/health

# Check metadata
curl http://localhost:3000/meta
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Update schema and mappings
4. Test locally with Docker
5. Submit pull request

## 🆘 Support

- Documentation: See `ARCHITECTURE.md` for detailed diagrams
- SubQuery Docs: https://academy.subquery.network
- The Graph Docs: https://thegraph.com/docs
- Issues: Report at GitHub issues
