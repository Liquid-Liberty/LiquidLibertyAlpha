# 🏛️ Liquid Liberty Market

A decentralized marketplace with integrated LMKT token trading charts, built with React, Vite, and Ethereum smart contracts.

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Network Configuration
VITE_DEPLOY_ENV=sepolia                    # sepolia | pulse | local

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
PULSE_RPC_URL=https://rpc.v4.testnet.pulsechain.com

# Deployment Keys
SIGNER_PRIVATE_KEY=your_private_key_for_deployment
ACCOUNT_PRIVATE_KEY=your_account_private_key

# API Keys
SEPOLIA_API_KEY=your_etherscan_api_key
```

---

## 📦 Smart Contract Deployment

### 🎯 One-Command Deployment (Recommended)

The enhanced deployment system automatically syncs contract addresses across all configuration files:

```bash
# Deploy to Sepolia + auto-sync all addresses
npm run deploy:sepolia

# Deploy to Pulse + auto-sync all addresses
npm run deploy:pulse

# Deploy to localhost for development
npm run deploy:local
```

### ⚙️ What Happens During Deployment

1. **Deploys all contracts** to the specified network
2. **Saves addresses** to `src/config/{network}/contract-addresses.json`
3. **Saves ABIs** to `src/config/` directory
4. **Auto-syncs addresses** to:
   - `subgraph/lmkt-subquery/project.ts`
   - `src/utils/secureNetworkConfig.js`
5. **Creates backups** of modified files
6. **Validates** all addresses before updating

### 🔧 Manual Address Sync (if needed)

```bash
# Sync all networks
npm run sync-addresses

# Sync specific networks
npm run sync-addresses:sepolia
npm run sync-addresses:pulse
npm run sync-addresses:local
```

---

## 📊 Subgraph Deployment

After deploying contracts, update and deploy the subgraph for chart data:

### Sepolia Subgraph

```bash
cd subgraph/lmkt-subquery

# Build for Sepolia
npm run build:sepolia

# Publish to OnFinality
npm run publish:sepolia
```

### Pulse Subgraph

```bash
cd subgraph/lmkt-subquery

# Build for Pulse
npm run build:pulse

# Publish to OnFinality
npm run publish:pulse
```

---

## 🏗️ Architecture

### Smart Contracts

- **Treasury.sol** - Handles LMKT buy/sell swaps and emits `MKTSwap` events
- **LMKT.sol** - ERC20 token contract
- **PaymentProcessor.sol** - Handles marketplace payments
- **ListingManager.sol** - Manages marketplace listings
- **Faucet.sol** - Test token distribution

### Frontend

- **React + Vite** - Modern frontend stack
- **TradingView Charts** - Professional trading interface
- **Wagmi + Web3Modal** - Ethereum wallet integration
- **Tailwind CSS** - Utility-first styling

### Data Layer

- **SubQuery/Subgraph** - Indexes blockchain events for charts
- **OnFinality** - Hosted subgraph infrastructure
- **GraphQL** - Query interface for chart data

---

## 📁 Project Structure

```
├── src/
│   ├── config/
│   │   ├── sepolia/contract-addresses.json    # Sepolia addresses
│   │   ├── pulse/contract-addresses.json      # Pulse addresses
│   │   └── *.json                             # Contract ABIs
│   ├── utils/secureNetworkConfig.js           # Network configurations
│   └── ...
├── scripts/
│   ├── deploy.js                              # Enhanced deployment
│   └── sync-addresses.js                      # Address sync utility
├── subgraph/lmkt-subquery/
│   ├── project.ts                             # Dynamic subgraph config
│   └── ...
└── contracts/                                 # Solidity contracts
```

---

## 🌐 Network Support

| Network | Chain ID | Status |
|---------|----------|--------|
| Sepolia Testnet | 11155111 | ✅ Supported |
| Pulse Testnet | 943 | ✅ Supported |
| Localhost | 31337 | ✅ Supported |

---

## 🔒 Security Features

- **No Unsafe Defaults** - All networks must be explicitly specified
- **Address Validation** - All Ethereum addresses are validated before use
- **Backup System** - Configuration files are backed up before updates
- **Network Isolation** - Addresses are kept separate per network

---

## 🛠️ Development Tools

```bash
# Linting
npm run lint

# Contract verification
npm run verify

# Address synchronization
npm run sync-addresses

# Build production
npm run build
```

---

## 📚 Additional Resources

- [Deployment Guide](./LMKT-deployment-guide.md) - Detailed deployment instructions
- [Smart Contracts Documentation](./contracts/) - Contract specifications
- [Subgraph Documentation](./subgraph/) - Chart data indexing

---

## 🎯 Key Features

- **Automated Address Management** - No more manual configuration updates
- **Multi-Network Support** - Deploy to Sepolia, Pulse, or localhost
- **Real-time Trading Charts** - TradingView integration with live blockchain data
- **Decentralized Marketplace** - List and trade items with crypto payments
- **Token Economics** - LMKT token with automated market making

---

*This project uses an enhanced deployment system that automatically manages contract addresses across all configuration files. No more manual updates required!* 🎉