# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

update frontend.....

# re-deploying Contracts on Sepolia - Treasury Address todos

### Update the Treasury address for the following files

`subgraph.yaml` - this is for the subgraph chart  

```

    dataSources:
  - kind: ethereum/contract
    name: Treasury
    network: sepolia
    source:
      address: "0xe758e36476376ccddf574144ab3e9a560d550de3"        # e.g. 0xYourSepoliaV2Pair / treasury address
      abi: Treasury
      startBlock: 9072300        # e.g. 5820000

```

`.env` - your environment variables  

```

VITE_TREASURY_ADDRESS=0xe758e36476376ccddf574144ab3e9a560d550de3
```

`contract-addresses.json`  feeds the  `contract-config`  

`contract-config`  

```

{
  "listingManager": "0xc3c55d9f114F9227dE23a19bF5c875d5824Ac6C1",
  "treasury": "0xe758e36476376ccddf574144ab3e9a560d550de3",
  "lmkt": "0x58ac848dAC12e40afc52851fB26B0eB68C547415",
  "paymentProcessor": "0x8b16a1Edf9C9De827c165CF8919cC3F1E3476AA5",
  "faucet": "0xb818B0f10f2e7A866A441bF719d20F5153a14eFa",
  "priceOracleConsumer": "0x6F70E587b42Fa4C7b09cBc8e7A27807f348999EE",
  "mockDai": "0xA794bf05d685345B1324262aa0d4cE7Ad3e17319"
}
```

`subgraph-config` - this is the config helper that sets the value for:  

- `SUBGRAPH_CONFIG.URL` - graph URL route
- `SUBGRAPH_CONFIG.PAIR_ADDRESS` - `Treasury address`

```

// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.7", make it your current version

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xe758e36476376ccddf574144ab3e9a560d550de3",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};

```
`Netlify` environment variables need to be updated to the new Treasury Address