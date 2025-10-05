# 🏗️ Frontend DApp Architecture

## System Overview

The Liquid Liberty Frontend is a React-based decentralized application that provides a marketplace interface with integrated LMKT token trading. Built with Vite, Wagmi, and TradingView, it connects users to the blockchain through Web3 wallets.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
│  - Web Browser (Chrome, Firefox, Brave, etc.)              │
│  - Web3 Wallet Extension (MetaMask, etc.)                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Components Layer                      │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │  │
│  │  │  Pages   │  │Components│  │  Context/Hooks  │   │  │
│  │  │          │  │          │  │                 │   │  │
│  │  │ • Home   │  │ • Header │  │ • Listings      │   │  │
│  │  │ • Market │  │ • Charts │  │ • Web3          │   │  │
│  │  │ • Trade  │  │ • Cards  │  │ • Config        │   │  │
│  │  │ • Dash   │  │ • Forms  │  │                 │   │  │
│  │  └──────────┘  └──────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Web3 Integration Layer (Wagmi)              │  │
│  │                                                       │  │
│  │  • Wallet Connection (Web3Modal)                     │  │
│  │  • Contract Interactions (useWriteContract)          │  │
│  │  • Transaction Management (useWaitForReceipt)        │  │
│  │  • Network Switching                                 │  │
│  │  • Balance Queries                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Data Layer (TanStack Query)                │  │
│  │                                                       │  │
│  │  • Server State Caching                              │  │
│  │  • GraphQL Queries to Indexer                        │  │
│  │  • API Calls to Serverless Functions                │  │
│  │  • Optimistic Updates                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────┬─────────────────┬───────────────────┬─────────────────┘
     │                 │                   │
     ▼                 ▼                   ▼
┌──────────┐  ┌─────────────────┐  ┌────────────────┐
│Blockchain│  │  Serverless API │  │    Indexer     │
│Contracts │  │  (Netlify)      │  │   (GraphQL)    │
└──────────┘  └─────────────────┘  └────────────────┘
```

## Component Hierarchy

```
App.jsx
│
├── Header.jsx
│   ├── Navigation Links
│   ├── Wallet Connect Button
│   ├── Network Switcher
│   └── Balance Display
│
├── Router (React Router)
│   │
│   ├── HomePage.jsx
│   │   ├── Hero Section
│   │   ├── LMKT Chart (TVChart.jsx)
│   │   └── Recent Listings
│   │
│   ├── ForSalePage.jsx
│   │   ├── Category Filter
│   │   ├── Search Bar
│   │   └── Listing Grid (ItemListingCard.jsx)
│   │
│   ├── ServicesPage.jsx
│   │   └── Service Listings (ServiceListingCard.jsx)
│   │
│   ├── CreateListingPage.jsx
│   │   ├── Image Upload
│   │   ├── Listing Form
│   │   └── Submit Handler
│   │
│   ├── ListingDetailPage.jsx
│   │   ├── Image Gallery
│   │   ├── Listing Info
│   │   └── Purchase Button
│   │
│   ├── DashboardPage.jsx
│   │   ├── MyListings.jsx
│   │   ├── Purchase History
│   │   └── Trading Stats
│   │
│   └── VendorsPage.jsx
│       └── VendorSimulator.jsx
│
└── Footer.jsx
```

## Data Flow Diagrams

### 1. Create Listing Flow

```
User fills form → Upload images → Convert to base64
                                          ↓
                                   API: upload-images-to-ipfs
                                          ↓
                                   Receives IPFS hash
                                          ↓
                                   API: create-listing-signature
                                          ↓
                                   Receives EIP-712 signature
                                          ↓
                                   Approve LMKT fee (Wagmi)
                                          ↓
                                   Submit to ListingManager contract
                                          ↓
                                   Wait for confirmation
                                          ↓
                                   Refresh listings
```

### 2. Buy LMKT Flow

```
User enters amount → Calculate LMKT to receive
                              ↓
                    Check approval status
                              ↓
                    If needed: Approve collateral
                              ↓
                    Submit buyMkt() transaction
                              ↓
                    Wait for confirmation
                              ↓
                    Update balances
                              ↓
                    Chart refreshes from indexer
```

### 3. Chart Data Flow

```
TradingView requests data → Datafeed queries indexer GraphQL
                                          ↓
                                   Fetch candles query
                                          ↓
                                   Transform to TV format
                                          ↓
                                   Return bars array
                                          ↓
                                   TradingView renders chart
```

## State Management

### Context Providers

```javascript
// ListingsContext.jsx
const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);

  const refreshListings = async () => {
    // Fetch from contract or indexer
    const data = await fetchListings();
    setListings(data);
  };

  return (
    <ListingsContext.Provider value={{
      listings,
      refreshListings
    }}>
      {children}
    </ListingsContext.Provider>
  );
};
```

### Wagmi Configuration

```javascript
// main.jsx
const wagmiConfig = defaultWagmiConfig({
  chains: [sepolia, pulse, hardhatLocalNode],
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Liberty Market',
    description: 'Decentralized Marketplace',
    url: SITE_URL,
    icons: [`${SITE_URL}/icon-512.png`]
  }
});

createWeb3Modal({ wagmiConfig, projectId, chains });
```

### TanStack Query

```javascript
// Query for balance
const { data: balance } = useQuery({
  queryKey: ['balance', address, tokenAddress],
  queryFn: () => readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address]
  })
});
```

## Network Configuration

### Dynamic Network Support

```javascript
// main.jsx
const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV;

if (!DEPLOY_ENV) {
  throw new Error('VITE_DEPLOY_ENV must be set');
}

const chains = DEPLOY_ENV === 'sepolia'
  ? [sepolia, pulse]
  : [hardhatLocalNode, pulse];
```

### Contract Configuration

```javascript
// hooks/useContractConfig.js
export const useContractConfig = () => {
  const { chain } = useAccount();

  const networkConfig = {
    11155111: { // Sepolia
      treasury: TREASURY_ADDRESS_SEPOLIA,
      lmkt: LMKT_ADDRESS_SEPOLIA,
      // ...
    },
    943: { // Pulse
      treasury: TREASURY_ADDRESS_PULSE,
      lmkt: LMKT_ADDRESS_PULSE,
      // ...
    }
  };

  const config = networkConfig[chain?.id];

  return {
    treasuryConfig: {
      address: config.treasury,
      abi: TreasuryABI
    },
    lmktConfig: {
      address: config.lmkt,
      abi: LMKT_ABI
    }
  };
};
```

## TradingView Integration

### Datafeed Implementation

```javascript
// helpers/chartingDatafeed.js
export const createDatafeed = (subqueryUrl, pairAddress) => ({
  onReady: (callback) => {
    setTimeout(() => callback({
      supported_resolutions: ['1', '5', '15', '60', '240', '1D']
    }), 0);
  },

  resolveSymbol: (symbolName, onResolve) => {
    const symbolInfo = {
      ticker: 'LMKT/USD',
      name: 'LMKT/USD',
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: 100000000,
      has_intraday: true,
      supported_resolutions: ['1', '5', '15', '60', '240', '1D']
    };
    onResolve(symbolInfo);
  },

  getBars: async (symbolInfo, resolution, periodParams, onResult) => {
    const query = `
      query {
        candles(
          where: { interval: "${resolutionToSeconds(resolution)}" }
          orderBy: timestamp
          orderDirection: desc
          first: 1000
        ) {
          timestamp
          open
          high
          low
          close
          volume
        }
      }
    `;

    const response = await fetch(subqueryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const { data } = await response.json();
    const bars = transformCandlesToBars(data.candles);
    onResult(bars, { noData: bars.length === 0 });
  }
});
```

## Security Measures

### Input Validation

```javascript
// Validate Ethereum address
const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

// Validate amount
const isValidAmount = (amount) => {
  try {
    const bn = BigInt(amount);
    return bn > 0n;
  } catch {
    return false;
  }
};

// Sanitize user input
const sanitize = (str) => str
  .replace(/<script>/gi, '')
  .replace(/javascript:/gi, '')
  .trim()
  .slice(0, 1000);
```

### Transaction Safety

```javascript
// Always check approval before transfer
const checkApproval = async () => {
  const allowance = await readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, spenderAddress]
  });

  if (allowance < amount) {
    // Request approval first
    await writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, amount]
    });
  }
};

// Use slippage protection
const minAmountOut = calculateMinOutput(expectedAmount, slippageTolerance);
```

## Performance Optimizations

### Code Splitting

```javascript
// Route-based code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</Suspense>
```

### Memoization

```javascript
// Memoize expensive calculations
const calculatedPrice = useMemo(() => {
  return (totalCollateral * 1e8) / circulatingSupply;
}, [totalCollateral, circulatingSupply]);

// Memoize callbacks
const handleBuy = useCallback(async () => {
  await buyLMKT(amount);
}, [amount]);
```

### Query Caching

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
});
```

## Responsive Design

### Breakpoints

```javascript
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

### Mobile-First Approach

```jsx
<div className="
  flex flex-col          // Mobile: column
  md:flex-row           // Tablet+: row
  p-4                   // Mobile: padding 1rem
  md:p-8                // Tablet+: padding 2rem
">
  {/* Content */}
</div>
```

## Integration Points

### With Smart Contracts
- Uses Wagmi hooks for contract calls
- Imports ABIs from config
- Network-aware address resolution

### With Serverless API
- Fetch for IPFS uploads
- Signature generation requests
- Content moderation

### With Blockchain Indexer
- GraphQL queries for chart data
- Marketplace events
- Historical data

## Build & Deployment

### Vite Build Process

```
1. Parse JSX → JavaScript
2. Bundle modules
3. Tree shake unused code
4. Minify and compress
5. Generate source maps
6. Output to dist/
```

### Netlify Deployment

```
Git push → Netlify webhook → Build trigger
                                    ↓
                            Run: npm run build
                                    ↓
                            Publish: dist/
                                    ↓
                            Deploy to CDN
                                    ↓
                            Update DNS
```

## Error Handling

### Transaction Errors

```javascript
try {
  const hash = await writeContract({
    address: TREASURY_ADDRESS,
    abi: TreasuryABI,
    functionName: 'buyMkt',
    args: [amount, token, minOut]
  });

  const receipt = await waitForTransactionReceipt({ hash });

  if (receipt.status === 'success') {
    toast.success('Purchase successful!');
  }
} catch (error) {
  if (error.code === 4001) {
    toast.error('Transaction rejected');
  } else if (error.message.includes('insufficient funds')) {
    toast.error('Insufficient balance');
  } else {
    toast.error('Transaction failed');
  }
}
```

### Network Errors

```javascript
const handleNetworkSwitch = async (targetChainId) => {
  try {
    await switchNetwork({ chainId: targetChainId });
  } catch (error) {
    if (error.code === 4902) {
      // Network not added
      await addChain({ chain: targetChain });
    }
  }
};
```
