# Liquid Liberty Subgraph

A subgraph for fetching OHLCV (Open, High, Low, Close, Volume) data from Uniswap V2 pairs to display TradingView price charts.

## Features

- Tracks Uniswap V2 pair swaps
- Generates OHLCV candles for multiple time intervals:
  - 1 minute (60s)
  - 5 minutes (300s)
  - 15 minutes (900s)
  - 1 hour (3600s)
  - 4 hours (14400s)
  - 1 day (86400s)
- Stores token metadata (name, symbol, decimals)
- Tracks trading volume and trade counts

## Project Structure

```
subgraph/
├── abis/                    # Contract ABIs
│   ├── UniswapV2Pair.json  # Uniswap V2 Pair ABI
│   └── ERC20.json          # ERC20 Token ABI
├── src/                     # Source code
│   ├── mapping.ts          # Event handlers
│   └── utils.ts            # Utility functions
├── schema.graphql          # GraphQL schema
├── subgraph.yaml           # Subgraph manifest
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Graph CLI: `npm install -g @graphprotocol/graph-cli`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the subgraph:**
   Edit `subgraph.yaml` and update:
   - `address`: Your Uniswap V2 pair contract address
   - `startBlock`: Starting block number for indexing
   - `network`: Target network (mainnet, sepolia, etc.)

3. **Generate code:**
   ```bash
   npm run codegen
   ```

4. **Build the subgraph:**
   ```bash
   npm run build
   ```

## Deployment

### Local Development

1. **Start local Graph Node:**
   ```bash
   docker-compose up -d
   ```

2. **Create local subgraph:**
   ```bash
   npm run create:local
   ```

3. **Deploy to local node:**
   ```bash
   npm run deploy:local
   ```

### The Graph Studio (Recommended for production)

1. **Authenticate with Graph Studio:**
   ```bash
   graph auth --studio <ACCESS_TOKEN>
   ```

2. **Deploy to Graph Studio:**
   ```bash
   npm run deploy
   ```

### Hosted Service

1. **Authenticate with hosted service:**
   ```bash
   graph auth --product hosted-service <ACCESS_TOKEN>
   ```

2. **Deploy to hosted service:**
   ```bash
   npm run deploy:hosted
   ```

## Usage

Once deployed, you can query the subgraph for OHLCV data:

```graphql
{
  candles(
    where: {
      pair: "0x...", # Pair address
      interval: "3600" # 1 hour intervals
    }
    orderBy: bucketStart
    orderDirection: desc
    first: 100
  ) {
    id
    open
    high
    low
    close
    volumeToken0
    volumeToken1
    trades
    bucketStart
  }
}
```

## Configuration

### Supported Networks

- Ethereum Mainnet
- Sepolia Testnet
- Polygon
- Arbitrum
- Optimism

### Time Intervals

The subgraph automatically generates candles for these intervals:
- 1 minute (60s)
- 5 minutes (300s)
- 15 minutes (900s)
- 1 hour (3600s)
- 4 hours (14400s)
- 1 day (86400s)

## Troubleshooting

### Common Issues

1. **Codegen fails:** Ensure all ABIs are properly formatted and referenced
2. **Build fails:** Check TypeScript compilation errors
3. **Deployment fails:** Verify network configuration and contract addresses

### Debugging

- Check Graph Node logs for indexing errors
- Verify contract events are being emitted
- Ensure proper network configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
