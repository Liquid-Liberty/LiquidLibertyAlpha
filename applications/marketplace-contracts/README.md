# 🏛️ Liquid Liberty Smart Contracts

Ethereum smart contracts powering the Liquid Liberty decentralized marketplace. This application includes the LMKT token, Treasury AMM (Automated Market Maker), marketplace listing management, and payment processing contracts.

## 📋 Overview

This is a standalone smart contracts application that can be deployed independently to any EVM-compatible blockchain. The contracts work together to provide:

- **LMKT Token Economics**: ERC20 token with automated market making
- **Treasury AMM**: Buy/sell LMKT with dynamic pricing based on collateral reserves
- **Marketplace**: Create and manage listings for items and services
- **Payment Processing**: Secure payment handling with LMKT token integration

## 🏗️ Architecture

### Core Contracts

1. **LMKT.sol** - ERC20 token contract
   - Standard ERC20 implementation
   - Owned and managed by Treasury contract
   - Minting controlled by Treasury AMM logic

2. **Treasury.sol** - Automated Market Maker
   - Handles LMKT buy/sell operations
   - Dynamic pricing based on collateral reserves
   - Emits `MKTSwap` events for price tracking
   - Supports multiple whitelisted collateral tokens
   - Configurable fee rates (buy discount, sell premium)

3. **ListingManager.sol** - Marketplace Listings
   - EIP-712 signature-based listing creation
   - Support for items and services
   - IPFS integration for metadata storage
   - Listing fees paid in LMKT

4. **PaymentProcessor.sol** - Payment Handling
   - Secure payment routing
   - LMKT token integration
   - Marketplace fee distribution

5. **Faucet.sol** - Test Token Distribution
   - Dispense test tokens for development
   - Configurable drip amounts

### Supporting Contracts

- **MockPriceOracle.sol** - Price feed simulation
- **GenericERC20.sol** - ERC20 for testing (mDAI)
- **Interfaces** - ITreasury, ILMKT, IListingManager

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or later
- npm or yarn
- A wallet with testnet ETH/PLS

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

Edit `.env` file:

```bash
# Network selection
VITE_DEPLOY_ENV=sepolia  # or pulse, local

# RPC endpoints
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PULSE_RPC_URL=https://rpc.v4.testnet.pulsechain.com

# Deployment wallet
SIGNER_PRIVATE_KEY=your_private_key_here

# For contract verification
SEPOLIA_API_KEY=your_etherscan_api_key
```

### Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Pulse testnet
npm run deploy:pulse

# Deploy to local Hardhat node
npm run deploy:local
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/Treasury.test.js

# Run with gas reporting
REPORT_GAS=true npm test
```

## 📦 Deployment Process

The deployment script (`scripts/deploy.js`) performs the following:

1. **Deploys Dependencies**
   - MockPriceOracle (for testing)
   - MockDAI (test collateral token)
   - LMKT token

2. **Deploys Core Contracts**
   - Treasury
   - ListingManager
   - PaymentProcessor
   - Faucet

3. **Configuration**
   - Sets up price oracle with mDAI/USD = $1.00
   - Configures Treasury with LMKT address
   - Whitelists mDAI as collateral
   - Sets price feeds and query IDs
   - Seeds Treasury with initial collateral
   - Transfers LMKT ownership to Treasury
   - Configures Faucet as mDAI minter
   - Sets PaymentProcessor in ListingManager

4. **Saves Artifacts**
   - Contract addresses saved to `src/config/{network}/contract-addresses.json`
   - ABIs saved to `src/config/`
   - Syncs addresses to other applications (indexer, frontend)

## 📊 Contract Addresses

After deployment, addresses are saved in network-specific files:

```
src/config/
├── sepolia/
│   └── contract-addresses.json
├── pulse/
│   └── contract-addresses.json
└── localhost/
    └── contract-addresses.json
```

## 🔐 Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Access control for admin functions
- **SafeERC20**: Safe token transfer operations
- **EIP-712**: Signature-based listing creation
- **Slippage Protection**: Min output amounts for swaps
- **Address Validation**: All addresses validated before use

## 🧪 Testing

Test suite includes:

- **Treasury.test.js** - AMM functionality, buy/sell, fees
- **ListingManager.test.js** - Listing creation, validation
- **PaymentProcessor.test.js** - Payment routing, fee distribution
- **TreasuryChart.test.js** - Price calculation and event emission

Coverage includes:
- Admin functions and access control
- Core buy/sell mechanics
- Edge cases and error conditions
- Security validations

## 🛠️ Development

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy
npm run deploy:local

# Run scripts
npx hardhat run scripts/yourScript.js --network localhost
```

### Contract Verification

```bash
# Verify on Etherscan
npm run verify

# Manual verification
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "Constructor Arg1" "Constructor Arg2"
```

### Address Synchronization

The contract deployment automatically syncs addresses to:
- Indexer application (`project.ts`)
- Frontend application (`secureNetworkConfig.js`)

Manual sync:
```bash
npm run sync-addresses
npm run sync-addresses:sepolia
npm run sync-addresses:pulse
```

## 🌐 Supported Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Sepolia Testnet | 11155111 | https://eth-sepolia.g.alchemy.com/v2/... |
| Pulse Testnet | 943 | https://rpc.v4.testnet.pulsechain.com |
| Localhost | 31337 | http://127.0.0.1:8545 |

## 📝 Event Emissions

### MKTSwap Event
```solidity
event MKTSwap(
    address indexed sender,
    address indexed collateralToken,
    uint256 collateralAmount,
    uint256 lmktAmount,
    uint256 totalCollateral,
    uint256 circulatingSupply,
    bool isBuy
);
```

This event is indexed by the blockchain indexer to create price charts.

## 🔗 Integration with Other Apps

### Indexer Integration
The indexer application listens to `MKTSwap` events from the Treasury contract to build OHLCV (Open, High, Low, Close, Volume) data for trading charts.

### Frontend Integration
The frontend uses contract ABIs and addresses from this application to interact with the blockchain.

### API Integration
Serverless functions use contract addresses for signature generation and verification.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🆘 Support

- Documentation: See `ARCHITECTURE.md` for detailed flow diagrams
- Issues: Report at GitHub issues
- Network Issues: Check RPC endpoint health
- Test Failures: Ensure local node is running for local tests
