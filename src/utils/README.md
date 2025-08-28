# Subgraph Integration

This directory contains utilities for integrating with the Liquid Liberty subgraph.

## Files

- `subgraph.js` - Main utility functions for fetching data from the subgraph
- `lmkt-config.js` - Configuration file for LMKT chart settings
- `README.md` - This documentation file

## Setup

The subgraph URL is configured in `subgraph.js`:
```javascript
const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.1';

```

**Important**: You need to update the `PAIR_ADDRESS` in `src/config/lmkt-config.js` with the actual LMKT pair address from your subgraph.

## Configuration

The `lmkt-config.js` file contains all LMKT-specific settings:

- **PAIR_ADDRESS**: The LMKT trading pair address from your subgraph
- **INTERVALS**: Supported time intervals (1h, 4h, 1d, 1w)
- **DEFAULT_INTERVAL**: Default chart time interval
- **COLORS**: Chart color scheme for different data series

## Usage

### Basic Data Fetching

```javascript
import { fetchFromSubgraph } from './utils/subgraph';

// Custom GraphQL query
const query = `
  query {
    // Your GraphQL query here
  }
`;

const data = await fetchFromSubgraph(query);
```

### LMKT Token Data

```javascript
import { fetchLMKTData, fetchLMKTCurrentStats } from './utils/subgraph';

// Fetch historical data for chart
const chartData = await fetchLMKTData(30); // Last 30 days

// Fetch current token statistics
const currentStats = await fetchLMKTCurrentStats();
```

### LMKT Trading History

```javascript
import { fetchLMKTTrades } from './utils/subgraph';

// Fetch recent trades
const trades = await fetchLMKTTrades(100); // Last 100 trades
```

## GraphQL Schema

The implementation uses the actual subgraph schema with OHLCV data:

### Actual Schema:

```graphql
type Candle @entity {
  id: ID!
  bucketStart: BigInt!
  open: BigInt!
  high: BigInt!
  low: BigInt!
  close: BigInt!
  volumeToken0: BigInt!
  volumeToken1: BigInt!
  trades: BigInt!
  pair: String!
  interval: String!
}
```

### Usage:

```javascript
// Fetch OHLCV data
const candles = await fetchLMKTData(
  "0x1234...", // pair address
  "1d",         // interval (1h, 4h, 1d, 1w)
  100           // limit
);

// Fetch current stats from latest candle
const stats = await fetchLMKTCurrentStats("0x1234...");
```

## Error Handling

All functions include proper error handling and will fall back to mock data if the subgraph is unavailable. Check the browser console for detailed error messages.

## Mock Data

When the subgraph is not available, the system falls back to mock data to ensure the UI remains functional. This allows for development and testing even without a running subgraph.

## Customization

To customize the data fetching:

1. Update the GraphQL queries in `subgraph.js`
2. Modify the data transformation functions
3. Adjust the mock data structure if needed
4. Update the chart component to handle new data fields

## Troubleshooting

- **Connection refused**: Ensure your subgraph is running on `https://cowboy.blocketize.io`
- **GraphQL errors**: Check the subgraph schema and update queries accordingly
- **Data not loading**: Verify the subgraph endpoint and network connectivity
- **Mock data showing**: Check browser console for subgraph fetch errors
