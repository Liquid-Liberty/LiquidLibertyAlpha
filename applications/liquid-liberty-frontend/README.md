# 🚀 Liquid Liberty Frontend DApp

React-based decentralized application (DApp) for the Liquid Liberty Marketplace. Features a full marketplace for buying/selling items and services, integrated LMKT token trading with TradingView charts, and Web3 wallet integration.

## 📋 Overview

This standalone frontend application provides the user interface for:

- **Marketplace**: Browse, create, and purchase listings for items and services
- **LMKT Trading**: Buy/sell LMKT tokens with live price charts
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and other Web3 wallets
- **Real-time Charts**: TradingView integration for professional trading interface
- **Vendor Profiles**: Simulate and track vendor performance
- **User Dashboard**: Manage your listings and transactions

## 🏗️ Technology Stack

### Core Framework
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling

### Web3 Integration
- **Wagmi v2** - React hooks for Ethereum
- **Web3Modal v4** - Wallet connection UI
- **Ethers.js v6** - Ethereum library
- **Viem** - TypeScript Ethereum library

### Data & Charts
- **TanStack Query** - Server state management
- **TradingView Charting Library** - Professional charts
- **Lightweight Charts** - Alternative charting
- **Chart.js** - Data visualization
- **Recharts** - React chart components

### UI & Animation
- **Framer Motion** - Animation library
- **Tailwind CSS** - Styling
- **Custom Components** - Reusable UI elements

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or later
- Web3 wallet (MetaMask recommended)
- Testnet ETH/PLS for transactions

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

# Site URL (for Web3Modal)
VITE_SITE_URL=https://your-app.netlify.app

# WalletConnect Project ID
VITE_PROJECT_ID=your_walletconnect_project_id

# API endpoint
VITE_API_BASE_URL=https://your-api.netlify.app/.netlify/functions

# GraphQL endpoints
VITE_SUBQUERY_SEPOLIA_URL=https://api.subquery.network/sq/.../sepolia
VITE_SUBQUERY_PULSE_URL=https://api.subquery.network/sq/.../pulse

# Contract addresses (auto-synced from deployment)
VITE_TREASURY_ADDRESS_SEPOLIA=0x...
VITE_LMKT_ADDRESS_SEPOLIA=0x...
# ... (additional addresses)
```

### Development

```bash
# Start dev server
npm run dev

# App runs at http://localhost:5173

# Open in browser and connect wallet
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Netlify (auto-deploy via Git)
git push origin main
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx       # Navigation header
│   ├── Footer.jsx       # Site footer
│   ├── TVChart.jsx      # TradingView chart wrapper
│   ├── LMKTChart.jsx    # LMKT price chart
│   ├── MyListings.jsx   # User's listings manager
│   ├── VendorSimulator.jsx  # Vendor performance simulator
│   └── ...
├── pages/               # Route pages
│   ├── HomePage.jsx     # Landing page
│   ├── ForSalePage.jsx  # Items marketplace
│   ├── ServicesPage.jsx # Services marketplace
│   ├── CreateListingPage.jsx  # Create new listing
│   ├── ListingDetailPage.jsx  # Listing details
│   ├── DashboardPage.jsx      # User dashboard
│   └── ...
├── context/             # React context providers
│   └── ListingsContext.jsx  # Listings state management
├── hooks/               # Custom React hooks
│   ├── useContractConfig.js # Contract configuration
│   └── ...
├── config/              # Configuration files
│   ├── subgraph-config.js   # Indexer endpoints
│   ├── lmkt-config.js       # LMKT config
│   ├── sepolia/             # Sepolia network config
│   │   └── contract-addresses.json
│   └── pulse/               # Pulse network config
│       └── contract-addresses.json
├── utils/               # Utility functions
│   ├── secureNetworkConfig.js  # Network utilities
│   └── ...
├── helpers/             # Helper modules
│   └── chartingDatafeed.js  # TradingView data provider
├── data/                # Static data
├── assets/              # Images, icons
├── App.jsx              # Main app component
└── main.jsx             # App entry point
```

## 🎨 Key Features

### 1. Marketplace

**Browse Listings**
- Filter by category (electronics, vehicles, services, etc.)
- Search functionality
- Sort by price, date, popularity

**Create Listings**
- Upload images to IPFS
- Add title, description, category, price
- Moderation via API
- EIP-712 signature verification

**Purchase Items**
- Buy with LMKT or mDAI
- Secure payment processing
- Transaction confirmation
- Event tracking

### 2. LMKT Trading

**Buy LMKT**
- Swap collateral (mDAI) for LMKT
- Dynamic pricing based on reserves
- Slippage protection
- Real-time price updates

**Sell LMKT**
- Exchange LMKT for collateral
- Premium pricing mechanism
- Balance checks
- Transaction history

**Trading Charts**
- TradingView integration
- OHLCV candles (1m, 5m, 15m, 1h, 4h, 1d)
- Volume indicators
- Real-time updates from indexer

### 3. Wallet Integration

**Supported Wallets**
- MetaMask
- WalletConnect
- Coinbase Wallet
- Injected wallets
- EIP-6963 wallets

**Features**
- Multi-network support (Sepolia, Pulse, Local)
- Automatic network switching
- Balance display
- Transaction management

### 4. User Dashboard

**My Listings**
- View active listings
- Edit/delete listings
- Purchase history
- Earnings tracking

**Transactions**
- LMKT trades
- Marketplace purchases
- Fee history
- Export data

## 🔧 Core Components

### Header Component

Located in [src/components/Header.jsx](src/components/Header.jsx)

Features:
- Responsive navigation
- Wallet connection button
- Network switcher
- Balance display
- LMKT price ticker

### TVChart Component

Located in [src/components/TVChart.jsx](src/components/TVChart.jsx)

Features:
- TradingView Charting Library integration
- Custom datafeed from indexer
- Multiple timeframes
- Drawing tools
- Indicators

### CreateListingPage

Located in [src/pages/CreateListingPage.jsx](src/pages/CreateListingPage.jsx)

Process:
1. User uploads images
2. Frontend converts to base64
3. Calls API to upload to IPFS
4. Receives IPFS hash
5. Requests signature from API
6. Submits to ListingManager contract
7. Listing goes live

### MyListings Component

Located in [src/components/MyListings.jsx](src/components/MyListings.jsx)

Features:
- Fetch user's listings from contract
- Display listing cards
- Mark as sold
- Delete listings
- View purchase history

## 🔌 API Integration

### IPFS Upload

```javascript
const response = await fetch(`${API_BASE_URL}/upload-images-to-ipfs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    images: base64Images,
    listingData: metadata
  })
});

const { listingMetadataHash } = await response.json();
```

### Signature Request

```javascript
const response = await fetch(`${API_BASE_URL}/create-listing-signature`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    listingType: 0,
    dataIdentifier: `ipfs://${ipfsHash}`,
    userAddress: address,
    feeInToken: fee,
    deadline: Math.floor(Date.now() / 1000) + 3600
  })
});

const { signature } = await response.json();
```

### Indexer Query

```javascript
const response = await fetch(SUBQUERY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query {
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
        }
      }
    `
  })
});

const { data } = await response.json();
```

## 🎯 Contract Interaction

### Using Wagmi Hooks

```javascript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Buy LMKT
const { data: hash, writeContract } = useWriteContract();

const buyLMKT = () => {
  writeContract({
    address: TREASURY_ADDRESS,
    abi: TreasuryABI,
    functionName: 'buyMkt',
    args: [collateralAmount, collateralToken, minLmktOut]
  });
};

// Wait for transaction
const { isSuccess } = useWaitForTransactionReceipt({ hash });
```

### Using Contract Config Hook

```javascript
import { useContractConfig } from './hooks/useContractConfig';

const { treasuryConfig, lmktConfig } = useContractConfig();

// Contracts are pre-configured with addresses and ABIs
```

## 🌐 Network Support

The app supports multiple networks with automatic configuration:

### Sepolia Testnet
- Chain ID: 11155111
- RPC: Alchemy
- Faucet: https://sepoliafaucet.com

### Pulse Testnet
- Chain ID: 943
- RPC: https://rpc.v4.testnet.pulsechain.com
- Faucet: https://faucet.v4.testnet.pulsechain.com

### Local Development
- Chain ID: 31337
- RPC: http://localhost:8545
- Hardhat node required

## 🎨 Styling

### Tailwind Configuration

Located in [tailwind.config.cjs](tailwind.config.cjs)

Custom theme:
```javascript
theme: {
  extend: {
    colors: {
      'brand-teal': '#0d9488',
      'brand-stone': '#292524'
    },
    fontFamily: {
      'display': ['Inter', 'sans-serif']
    }
  }
}
```

### Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly interface
- Adaptive layouts

## 🔐 Security Features

### Input Validation
- Address validation before transactions
- Amount validation (non-zero, sufficient balance)
- Slippage tolerance
- Deadline checks

### Content Moderation
- Banned words filter via API
- Image validation
- Metadata sanitization

### Transaction Safety
- Approval flow for token spending
- Confirmation modals
- Error handling
- Gas estimation

## 📊 State Management

### React Context

**ListingsContext** - Global listings state
```javascript
const { listings, refreshListings } = useListings();
```

### TanStack Query

Server state caching:
```javascript
const queryClient = new QueryClient();

// Cache contract reads
useQuery({
  queryKey: ['balance', address],
  queryFn: () => fetchBalance(address)
});
```

## 🚢 Deployment

### Netlify Deployment

The app auto-deploys when pushed to main branch.

**netlify.toml** (in root):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables

Set in Netlify Dashboard > Site Settings > Environment Variables:
- `VITE_DEPLOY_ENV`
- `VITE_PROJECT_ID`
- `VITE_SUBQUERY_SEPOLIA_URL`
- `VITE_SUBQUERY_PULSE_URL`
- All contract addresses

### Build Settings

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20

## 🧪 Testing

### Manual Testing

```bash
# Test wallet connection
1. Connect wallet
2. Switch networks
3. Check balance display

# Test marketplace
1. Create listing
2. Upload images
3. Submit transaction
4. Verify listing appears

# Test trading
1. Buy LMKT
2. Check price chart updates
3. Sell LMKT
4. Verify balance changes
```

### Debug Mode

Enable in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 🔗 Integration with Other Apps

### Contracts Integration
- Uses deployed contract addresses
- Imports ABIs from config
- Validates contract interactions

### API Integration
- Calls serverless functions for backend operations
- Handles IPFS uploads
- Receives signatures

### Indexer Integration
- Queries GraphQL for chart data
- Fetches marketplace events
- Real-time updates

## 🎯 User Flows

### Create Listing Flow

1. User navigates to Create Listing
2. Fills form (title, description, category, price)
3. Uploads images (converted to base64)
4. Frontend calls `/upload-images-to-ipfs`
5. Receives IPFS hash
6. Frontend calls `/create-listing-signature`
7. Receives EIP-712 signature
8. User approves LMKT fee
9. User submits transaction to ListingManager
10. Transaction confirmed
11. Listing appears on marketplace

### Buy LMKT Flow

1. User navigates to trading page
2. Enters amount of collateral to swap
3. Sees LMKT amount to receive
4. Sets slippage tolerance
5. Approves collateral spending
6. Clicks "Buy LMKT"
7. Transaction sent to Treasury contract
8. LMKT minted to user
9. Chart updates with new price
10. Balance reflects changes

## 📈 Performance

### Optimizations

- Code splitting by route
- Lazy loading components
- Image optimization
- Chart data caching
- Memoized calculations

### Bundle Size

- Optimized with Vite
- Tree shaking enabled
- Minimal dependencies
- ~500KB initial bundle

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 🆘 Support

- Documentation: See `ARCHITECTURE.md` for detailed diagrams
- React Docs: https://react.dev
- Wagmi Docs: https://wagmi.sh
- Vite Docs: https://vitejs.dev
- Issues: Report at GitHub issues
