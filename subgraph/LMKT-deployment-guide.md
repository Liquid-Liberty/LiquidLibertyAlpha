# 📈 LMKT Chart Integration & Deployment Guide

This README explains how the **LMKT Trading Chart** is wired up, how it fetches real on-chain swap data, and the full deployment workflow (contracts → subgraph → frontend on Netlify).

---

## ⚙️ Architecture Overview

The LMKT chart is powered by three main layers:

1. **Smart Contracts (Hardhat / Sepolia)**  
   - `LMKT.sol` → ERC20 token contract  
   - `Treasury.sol` → Handles LMKT buy/sell swaps and emits `MKTSwap` events  
   - `PaymentProcessor.sol` → Utility contract for routing payments  
   - Deployment produces contract addresses (Treasury, LMKT, PaymentProcessor, etc.)

2. **Subgraph (The Graph Studio / Hosted Service)**  
   - A subgraph is deployed to index the `Treasury` contract.  
   - It listens for the `MKTSwap` event:  

     ```solidity
     event MKTSwap(
       address indexed sender,
       address indexed collateralToken,
       uint256 collateralAmount,
       uint256 lmktAmount,
       uint256 price,
       bool isBuy
     );
     ```

   - Mapping code transforms these swaps into **Candlestick (OHLCV)** entities for the chart:
     - **Open / High / Low / Close**
     - **Volume**
     - **Trades**

3. **Frontend (React + TradingView Charting Library)**  
   - `TVChart.jsx` component initializes a TradingView chart widget.  
   - Data comes from a custom provider (`helpers/chartingDatafeed.js`) which queries the subgraph GraphQL endpoint.  
   - Price formatting & precision is overridden so LMKT decimals are displayed correctly (e.g. `0.010196`, not `0.010`).  

---

## 🔑 Environment Variables

Set these in **Netlify** or `.env` for local dev:

```env
# RPC & Network
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-alchemy-key
SEPOLIA_API_KEY=your-etherscan-api-key
```

## Contracts

```
- VITE_TREASURY_ADDRESS=0xe758e36476376ccddf574144ab3e9a560d550de3
- VITE_LMKT_ADDRESS=0x6b2f139d016e3a6693453e487be7dde97fac63eb
- VITE_DAI_ADDRESS=0x5baaf0147e669266989fbfd20c5f6ab2de507733
```

# Subgraph

```
- VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.3
```

## Deployment Workflow (Hardhat => Sepolia)

```
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# output contracts example:

LMKT deployed to: 0x6b2f139D016E3A6693453E487be7DdE97faC63Eb
Treasury deployed to: 0xe758e36476376ccddf574144ab3e9a560d550de3
PaymentProcessor deployed to: 0xa329594071cF56EE0c5DBf7956E556Ef71cA9fEC
```

Save these in `src/config/contract-addresses.json` and `.env`

# Deploy Subgraph (Graph Studio)

Update `subgraph.yaml`

```
source:
  address: "0xe758e36476376ccddf574144ab3e9a560d550de3" # Treasury
  abi: Treasury
  startBlock: 9072300
  ```

# Redeploy subgraph commands

    graph codegen
    graph build
    graph deploy --studio liberty-market-alpha

# Hook into Frontend

Config file - This file is responsible for passing the `SUBGRAPH_URL` and `PASS_ADDRESS` to the files that need them

`src/config/subgraph-config.js`

```
export const SUBGRAPH_CONFIG = {
  URL: import.meta.env.VITE_SUBGRAPH_URL,
  PAIR_ADDRESS: import.meta.env.VITE_TREASURY_ADDRESS.toLowerCase(),
  DEFAULT_INTERVAL: "60",
  DEFAULT_CANDLE_LIMIT: 100,
};
```

`src/config/contract-addresses.json`

```
{
  "treasury": "0xe758e36476376ccddf574144ab3e9a560d550de3",
  "lmkt": "0x6b2f139d016e3a6693453e487be7dde97fac63eb",
  "mockDai": "0x5baaf0147e669266989fbfd20c5f6ab2de507733"
}
```
