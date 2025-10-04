# Quick Start Guide - Liquid Liberty Subgraph

Get your OHLCV data subgraph up and running in minutes!

## 🚀 Quick Deploy (5 minutes)

### 1. Install Prerequisites
```bash
# Install Node.js (v16+) from https://nodejs.org/
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Install Docker Desktop from https://www.docker.com/
```

### 2. Configure Your Subgraph
Edit `subgraph.yaml` and update:
```yaml
address: "YOUR_UNISWAP_V2_PAIR_ADDRESS"  # Replace with actual address
startBlock: STARTING_BLOCK_NUMBER         # Replace with actual block
network: "sepolia"                        # Or "mainnet", "polygon", etc.
```

### 3. Deploy with One Command
```bash
# For Windows PowerShell
.\scripts\deploy.ps1 studio

# For Windows Command Prompt
scripts\deploy.bat studio

# For Linux/Mac
./scripts/deploy.sh studio
```

## 🔧 Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Code
```bash
npm run codegen
```

### 3. Build
```bash
npm run build
```

### 4. Deploy
```bash
# To Graph Studio (recommended)
npm run deploy

# To hosted service
npm run deploy:hosted

# Locally for testing
npm run deploy:local
```

## 📊 Query Your Data

Once deployed, query your OHLCV data:

```graphql
{
  candles(
    where: { pair: "YOUR_PAIR_ADDRESS", interval: "3600" }
    orderBy: bucketStart
    orderDirection: desc
    first: 100
  ) {
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

## 🌐 Deployment Options

| Option | Description | Best For |
|--------|-------------|----------|
| **Graph Studio** | Free, managed service | Production, testing |
| **Hosted Service** | Legacy hosted service | Existing projects |
| **Local** | Self-hosted Graph Node | Development, testing |

## 🔑 Get Access Tokens

### Graph Studio
1. Go to [Graph Studio](https://studio.thegraph.com/)
2. Connect your wallet
3. Create a new subgraph
4. Copy the access token

### Hosted Service
1. Go to [The Graph Hosted Service](https://thegraph.com/hosted-service/)
2. Sign in with GitHub
3. Create a new subgraph
4. Copy the access token

## 🐛 Troubleshooting

### Common Issues

**"Graph CLI not found"**
```bash
npm install -g @graphprotocol/graph-cli
```

**"Codegen fails"**
- Check that all ABIs are valid JSON
- Verify file paths in `subgraph.yaml`

**"Build fails"**
- Run `npm run codegen` first
- Check TypeScript errors

**"Deployment fails"**
- Verify access token is set
- Check network configuration
- Ensure contract address is correct

### Get Help

- [The Graph Documentation](https://thegraph.com/docs/)
- [Graph Studio Guide](https://thegraph.com/docs/studio/)
- [Subgraph Development](https://thegraph.com/docs/developing/creating-a-subgraph/)

## 📈 Next Steps

After deployment:

1. **Monitor indexing** in Graph Studio
2. **Test queries** with GraphiQL
3. **Integrate with frontend** using Apollo Client or similar
4. **Set up alerts** for indexing issues
5. **Scale** by adding more pairs or networks

## 🎯 Example Use Cases

- **TradingView charts** - Real-time price data
- **DEX analytics** - Volume and trade analysis
- **Portfolio tracking** - Historical performance
- **Risk management** - Price volatility analysis
- **Research** - Market behavior studies

---

**Need help?** Check the full [README.md](README.md) for detailed documentation!
