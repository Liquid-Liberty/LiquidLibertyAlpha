// project.ts

import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

// Validate and set deployment environment
const deployEnv = (process.env.VITE_DEPLOY_ENV || "").toLowerCase();

// Runtime vs Build-time detection
const isRuntime = process.env.NODE_ENV === 'production' || process.env.SUBQL_NODE === 'true';

// SAFETY: Always require explicit environment - no unsafe defaults allowed
if (!deployEnv) {
  throw new Error(
    `❌ VITE_DEPLOY_ENV must be explicitly set - no unsafe network defaults allowed!

    This prevents deploying to the wrong network due to fallback assumptions.

    Use one of:
    - VITE_DEPLOY_ENV=sepolia (for Sepolia testnet)
    - VITE_DEPLOY_ENV=pulse (for Pulse testnet)
    - VITE_DEPLOY_ENV=local (for local development)

    Example: VITE_DEPLOY_ENV=sepolia npm run build

    Runtime detected: ${isRuntime}
    Current deployEnv: "${deployEnv}"`
  );
}

// SAFE: Use only the explicitly provided environment
const finalDeployEnv = deployEnv;

console.log("🚀 Deploying SubQuery with ENV:", finalDeployEnv);
console.log("✅ Network explicitly set - no unsafe fallbacks used");
console.log("⚠️  Runtime detected:", isRuntime);

const config = {
  local: {
    rpcUrl: "http://localhost:8545",
    treasury: "0x0000000000000000000000000000000000000000",
    lmkt: "0x0000000000000000000000000000000000000000",
    paymentProcessor: "0x0000000000000000000000000000000000000000",
    listingManager: "0x0000000000000000000000000000000000000000",
    mDAI: "0x0000000000000000000000000000000000000000",
    chainId: "31337",
    startBlock: 0,
  },
  sepolia: {
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/tD-k4CLtNfq88JYH280Wu",
    treasury: "0x7F77768fb73bA33606EB569966C109cD5CFe0F09",
    lmkt: "0x85F30D0cE7376fCF47E2386fdE86BBD072C00201",
    paymentProcessor: "0xE521F93061b1e8F2DefAC380525edADb7bB19bA4",
    listingManager: "0x220c186b8996CF54f3e724C188DDbF63DFf1bf5D",
    mDAI: "0xA71f77eC57efB5FECe3D3DA7757E9F57946344EA",
    chainId: "11155111",
    startBlock: 9176744,
  },
  pulse: {
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    treasury: "0xe12538Ab1990A3318395B7Cb0cE682741e68194E",
    lmkt: "0x2b5A9618Eb6886D23Dd7276B436ac98C20427716",
    paymentProcessor: "0xa659F4f1611297ed382703798cEd30ddD41A4004",
    listingManager: "0x48FEb85273B7BAc5c85C3B89C21D91BCC4deb621",
    mDAI: "0xb1bCAc95d4eEC3aD216aCD3261cc1845A193e590",
    chainId: "943",
    startBlock: 22602590,
  },
} as const;

if (!(finalDeployEnv in config)) {
  throw new Error(
    `❌ Unknown deployEnv: ${finalDeployEnv} (expected 'local' | 'sepolia' | 'pulse')`
  );
}

const { rpcUrl, treasury, lmkt, paymentProcessor, listingManager, mDAI, chainId, startBlock } = config[
  finalDeployEnv as keyof typeof config
];

console.log("  → RPC URL:", rpcUrl);
console.log("  → Treasury Address:", treasury);
console.log("  → LMKT Address:", lmkt);
console.log("  → paymentProcessor Address:", paymentProcessor);
console.log("  → listingManager Address:", listingManager);
console.log("  → mDAI Address:", mDAI);
console.log("  → Chain ID:", chainId);
console.log("  → Start Block:", startBlock);

if (
  !rpcUrl ||
  !treasury ||
  !lmkt ||
  !paymentProcessor ||
  !listingManager ||
  !mDAI ||
  !chainId ||
  startBlock === undefined
) {
  throw new Error(`❌ Missing env vars for ${finalDeployEnv}:
    rpcUrl=${rpcUrl}
    treasuryAddress=${treasury}
    lmktAddress=${lmkt}
    paymentProcessor=${paymentProcessor}
    listingManager=${listingManager}
    mockDAI=${mDAI}
    chainId=${chainId}
    startBlock=${startBlock}`);
}

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.6", // Incremented version
  name: `liquid-liberty-subquery-${finalDeployEnv}`,
  description: "Subgraph for fetching OHLCV data for TradingView price charts",
  runner: {
    node: { name: "@subql/node-ethereum", version: "6.2.1" },
    query: { name: "@subql/query", version: "2.23.5" },
  },
  schema: { file: "./schema.graphql" },
  network: {
    chainId,
    endpoint: rpcUrl,
  },
  dataSources: [
    // ✅ Datasource 1: Treasury (for direct swaps)
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "Treasury",
        address: treasury,
      },
      assets: new Map([
        ["Treasury", { file: "./abis/Treasury.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleMKTSwap",
          },
        ],
      },
    },

    // ✅ Datasource 2: Payment Processor (for marketplace sales)
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "PaymentProcessor",
        address: paymentProcessor,
      },
      assets: new Map([
        ["PaymentProcessor", { file: "./abis/PaymentProcessor.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePurchaseMade",
            filter: {
              topics: ["PurchaseMade(uint256,address,address,uint256)"],
            },
          },
        ],
      },
    },

    // ✅ Datasource 3: Listing Manager (for listing fees)
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "ListingManager",
        address: listingManager,
      },
      assets: new Map([
        ["ListingManager", { file: "./abis/ListingManager.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleListingCreated",
            filter: {
              topics: ["ListingCreated(uint256,address,uint8,uint256)"],
            },
          },
        ],
      },
    },
  ],
  repository: "",
};

export const TREASURY_ADDRESS = treasury.toLowerCase();
export const LMKT_ADDRESS = lmkt.toLowerCase();
export const PAYMENT_PROCESSOR = paymentProcessor.toLowerCase();
export const LISTING_MANAGER = listingManager.toLowerCase();
export const MDAI_ADDRESS = mDAI.toLowerCase();

export default project;