# 🏛️ Liquid Liberty - Separated Applications

This directory contains the Liquid Liberty Marketplace codebase separated into **4 independent, executable applications**. Each application can be deployed and run independently while maintaining integration points for the complete system.

## 📦 Applications Overview

### 1. [liquid-liberty-contracts](./liquid-liberty-contracts/) - Smart Contracts
**Ethereum smart contracts for the decentralized marketplace**

- **Purpose**: Deploy and manage blockchain contracts
- **Technology**: Solidity, Hardhat, OpenZeppelin
- **Networks**: Sepolia, Pulse, Localhost
- **Contracts**: LMKT token, Treasury AMM, Marketplace, Payment Processing
- **Execution**: Deploys contracts to blockchain networks

**Quick Start**:
```bash
cd liquid-liberty-contracts
npm install
cp .env.example .env
npm run deploy:sepolia
```

**Key Features**:
- ✅ LMKT ERC20 token with automated market making
- ✅ Treasury contract for buy/sell swaps
- ✅ ListingManager for marketplace listings
- ✅ PaymentProcessor for secure transactions
- ✅ Comprehensive test suite

---

### 2. [liquid-liberty-indexer](./liquid-liberty-indexer/) - Blockchain Indexer
**Indexes blockchain events and provides GraphQL API for chart data**

- **Purpose**: Process blockchain events into queryable data
- **Technology**: SubQuery, The Graph, GraphQL, PostgreSQL
- **Networks**: Sepolia, Pulse, Localhost
- **Data**: OHLCV candles, swaps, marketplace events
- **Execution**: Runs as indexing service (Docker or cloud-hosted)

**Quick Start**:
```bash
cd liquid-liberty-indexer
cd subgraph/lmkt-subquery
npm install
npm run build:sepolia
npm run publish:sepolia
```

**Key Features**:
- ✅ OHLCV candlestick data generation (1m, 5m, 15m, 1h, 4h, 1d)
- ✅ Real-time event processing
- ✅ GraphQL API for queries
- ✅ Multi-network support
- ✅ Two implementations: SubQuery (primary) and The Graph

---

### 3. [liquid-liberty-api](./liquid-liberty-api/) - Serverless API
**Netlify serverless functions for backend operations**

- **Purpose**: Provide backend services (IPFS, signatures, moderation)
- **Technology**: Netlify Functions, Node.js, Pinata, Ethers.js
- **Deployment**: Netlify Edge Functions
- **Endpoints**: IPFS uploads, EIP-712 signatures, content filtering
- **Execution**: Serverless functions (auto-scales)

**Quick Start**:
```bash
cd liquid-liberty-api
npm install
cp .env.example .env
npm run dev
```

**Key Features**:
- ✅ Image upload to IPFS via Pinata
- ✅ EIP-712 signature generation
- ✅ Content moderation and filtering
- ✅ Secure subquery proxy
- ✅ Vendor simulation data handling

---

### 4. [liquid-liberty-frontend](./liquid-liberty-frontend/) - Frontend DApp
**React decentralized application for the marketplace**

- **Purpose**: User interface for marketplace and trading
- **Technology**: React, Vite, Wagmi, Web3Modal, TradingView
- **Deployment**: Netlify static hosting
- **Features**: Marketplace, LMKT trading, wallet integration, charts
- **Execution**: Runs as static web app

**Quick Start**:
```bash
cd liquid-liberty-frontend
npm install
cp .env.example .env
npm run dev
```

**Key Features**:
- ✅ Full marketplace (browse, create, purchase listings)
- ✅ LMKT token trading with live charts
- ✅ Web3 wallet integration (MetaMask, WalletConnect, etc.)
- ✅ TradingView chart integration
- ✅ User dashboard and analytics

---

## 🔗 Application Dependencies

### Data Flow
```
Smart Contracts → Blockchain Events → Indexer → GraphQL API → Frontend
                                                               ↗
                                          Serverless API ──────
```

### Integration Points

**Contracts ↔ Indexer**
- Indexer listens to contract events (MKTSwap, ListingCreated, PurchaseMade)
- Automatically syncs contract addresses from deployment

**Contracts ↔ API**
- API uses contract addresses for signature generation
- Validates against on-chain data

**Contracts ↔ Frontend**
- Frontend interacts with contracts via Wagmi
- Uses ABIs and addresses from deployment

**API ↔ Frontend**
- Frontend calls API for IPFS uploads
- Requests EIP-712 signatures
- Content moderation

**Indexer ↔ Frontend**
- Frontend queries GraphQL for chart data
- Real-time candle updates
- Marketplace event history

**API ↔ Indexer**
- API can proxy queries to indexer
- Caching and transformation

## 🚀 Complete System Deployment

### Step 1: Deploy Smart Contracts
```bash
cd liquid-liberty-contracts
npm install
cp .env.example .env
# Edit .env with your configuration
npm run deploy:sepolia
# Addresses automatically synced to other apps
```

### Step 2: Deploy Blockchain Indexer
```bash
cd liquid-liberty-indexer/subgraph/lmkt-subquery
npm install
# Addresses already synced from contracts deployment
npm run build:sepolia
npm run publish:sepolia
# Note the GraphQL endpoint URL
```

### Step 3: Deploy Serverless API
```bash
cd liquid-liberty-api
npm install
cp .env.example .env
# Edit .env with contract addresses and Pinata keys
# Set environment variables in Netlify Dashboard
git push origin main  # Auto-deploys to Netlify
```

### Step 4: Deploy Frontend DApp
```bash
cd liquid-liberty-frontend
npm install
cp .env.example .env
# Edit .env with API URL and indexer endpoint
# Set environment variables in Netlify Dashboard
npm run build
git push origin main  # Auto-deploys to Netlify
```

## 📋 Environment Variables

### Contracts
```bash
VITE_DEPLOY_ENV=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PULSE_RPC_URL=https://rpc.v4.testnet.pulsechain.com
SIGNER_PRIVATE_KEY=0x...
SEPOLIA_API_KEY=your_etherscan_key
```

### Indexer
```bash
BUILD_NETWORK=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
# Contract addresses auto-synced
```

### API
```bash
SIGNER_PRIVATE_KEY=0x...
JSON_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
LISTING_MANAGER_ADDRESS=0x...  # Auto-synced
PINATA_API_KEY=your_key
PINATA_API_SECRET=your_secret
```

### Frontend
```bash
VITE_DEPLOY_ENV=sepolia
VITE_PROJECT_ID=your_walletconnect_id
VITE_API_BASE_URL=https://your-api.netlify.app/.netlify/functions
VITE_SUBQUERY_SEPOLIA_URL=https://api.subquery.network/sq/.../sepolia
# Contract addresses auto-synced to config files
```

## 🛠️ Development Workflow

### Local Development (All Apps)
```bash
# Terminal 1 - Start local blockchain
cd liquid-liberty-contracts
npx hardhat node

# Terminal 2 - Deploy contracts locally
cd liquid-liberty-contracts
npm run deploy:local

# Terminal 3 - Start indexer
cd liquid-liberty-indexer/subgraph/lmkt-subquery
npm run subquery:start:docker

# Terminal 4 - Start API
cd liquid-liberty-api
npm run dev

# Terminal 5 - Start frontend
cd liquid-liberty-frontend
npm run dev
```

### Testing Individual Apps

**Contracts**:
```bash
cd liquid-liberty-contracts
npm test
npm run verify
```

**Indexer**:
```bash
cd liquid-liberty-indexer
# Test GraphQL queries
curl -X POST http://localhost:3000/graphql \
  -d '{"query": "{ candles { id } }"}'
```

**API**:
```bash
cd liquid-liberty-api
npm run test:signature
npm run test:debug
```

**Frontend**:
```bash
cd liquid-liberty-frontend
npm run lint
npm run build
npm run preview
```

## 📊 Network Support

All applications support these networks:

| Network | Chain ID | RPC URL | Status |
|---------|----------|---------|--------|
| Sepolia Testnet | 11155111 | Alchemy | ✅ Production |
| Pulse Testnet | 943 | Public RPC | ✅ Production |
| Localhost | 31337 | http://localhost:8545 | ✅ Development |

## 🔄 Update Workflow

### When Contracts Change
1. Deploy new contracts: `cd liquid-liberty-contracts && npm run deploy:sepolia`
2. Addresses auto-sync to indexer and frontend
3. Rebuild indexer: `cd liquid-liberty-indexer/subgraph/lmkt-subquery && npm run build:sepolia`
4. Redeploy indexer: `npm run publish:sepolia`
5. Update API env vars if needed
6. Redeploy frontend: `git push`

### When API Changes
1. Make changes to serverless functions
2. Test locally: `npm run dev`
3. Deploy: `git push` (auto-deploys)

### When Frontend Changes
1. Make UI/UX changes
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy: `git push` (auto-deploys)

### When Indexer Schema Changes
1. Update `schema.graphql`
2. Update mapping handlers
3. Rebuild: `npm run build:sepolia`
4. Redeploy: `npm run publish:sepolia`

## 📚 Documentation

Each application has comprehensive documentation:

- **README.md** - Setup, features, usage
- **ARCHITECTURE.md** - Technical architecture, flow diagrams
- **.env.example** - Required environment variables
- **package.json** - Dependencies and scripts

## 🔐 Security Considerations

### Private Keys
- Never commit `.env` files
- Use separate keys for different networks
- Rotate keys regularly
- Use hardware wallets for production

### API Security
- Enable CORS restrictions
- Rate limiting on Netlify
- Input validation
- Content moderation

### Contract Security
- Audited OpenZeppelin contracts
- ReentrancyGuard on sensitive functions
- Access control (Ownable)
- Comprehensive test coverage

## 🐛 Troubleshooting

### Contracts Won't Deploy
- Check RPC URL is correct
- Verify private key has funds
- Ensure network is specified

### Indexer Not Indexing
- Verify contract addresses in project.ts
- Check RPC endpoint accessibility
- Review start block number

### API Functions Failing
- Check Netlify environment variables
- Verify Pinata API keys
- Review function logs

### Frontend Can't Connect
- Verify wallet is on correct network
- Check contract addresses in config
- Review browser console errors

## 📈 Monitoring

### Contracts
- Etherscan/Explorer for transactions
- Gas usage tracking
- Event emission logs

### Indexer
- OnFinality dashboard for SubQuery
- Query performance metrics
- Indexing progress

### API
- Netlify function analytics
- Error rate monitoring
- Response time tracking

### Frontend
- Netlify analytics
- Web vitals
- User engagement metrics

## 🤝 Contributing

Each application accepts contributions:

1. Fork the repository
2. Choose application to work on
3. Create feature branch
4. Make changes and test
5. Submit pull request

## 📄 License

All applications: MIT License

## 🆘 Support

- **Contracts**: Issues related to smart contracts, deployment, testing
- **Indexer**: Issues with event indexing, GraphQL queries, data
- **API**: Issues with serverless functions, IPFS, signatures
- **Frontend**: Issues with UI, wallet connection, user experience

Report issues at: [GitHub Issues](https://github.com/Liquid-Liberty/issues)

## 🎯 Quick Reference

### Deploy Everything (Production)
```bash
# 1. Contracts
cd liquid-liberty-contracts && npm run deploy:sepolia

# 2. Indexer
cd ../liquid-liberty-indexer/subgraph/lmkt-subquery
npm run build:sepolia && npm run publish:sepolia

# 3. API (set env vars in Netlify, then)
cd ../../../liquid-liberty-api && git push

# 4. Frontend (set env vars in Netlify, then)
cd ../liquid-liberty-frontend && git push
```

### Start Everything (Local Development)
```bash
# Terminal 1: Blockchain
cd liquid-liberty-contracts && npx hardhat node

# Terminal 2: Deploy Contracts
cd liquid-liberty-contracts && npm run deploy:local

# Terminal 3: Indexer
cd liquid-liberty-indexer/subgraph/lmkt-subquery && npm run subquery:start:docker

# Terminal 4: API
cd liquid-liberty-api && npm run dev

# Terminal 5: Frontend
cd liquid-liberty-frontend && npm run dev
```

---

**Each application is production-ready and can operate independently!** 🚀
