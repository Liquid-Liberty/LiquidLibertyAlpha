// project.ts

import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

// ⚡ STRICT BUILD-TIME NETWORK DETECTION - NO DEFAULTS ALLOWED
// This must be set during build via BUILD_NETWORK environment variable
const BUILD_TIME_NETWORK = process.env.BUILD_NETWORK || process.env.VITE_DEPLOY_ENV;

// Fail fast at build time if no network specified
if (!BUILD_TIME_NETWORK) {
  throw new Error(
    `❌ BUILD ERROR: Network must be explicitly specified!

    Missing BUILD_NETWORK environment variable in build script.

    Expected usage:
    - BUILD_NETWORK=sepolia npm run build:sepolia
    - BUILD_NETWORK=pulse npm run build:pulse

    Current environment:
    BUILD_NETWORK: "${process.env.BUILD_NETWORK}"
    VITE_DEPLOY_ENV: "${process.env.VITE_DEPLOY_ENV}"

    This build cannot proceed without explicit network specification.`
  );
}

// Embed the network as a compile-time constant
const NETWORK = BUILD_TIME_NETWORK.toLowerCase();

// Validate network is supported
const SUPPORTED_NETWORKS = ['sepolia', 'pulse', 'local'];
if (!SUPPORTED_NETWORKS.includes(NETWORK)) {
  throw new Error(
    `❌ BUILD ERROR: Unsupported network "${NETWORK}"

    Supported networks: ${SUPPORTED_NETWORKS.join(', ')}

    Check your build script and ensure BUILD_NETWORK is set correctly.`
  );
}

// Use the embedded network constant
const finalDeployEnv = NETWORK;

console.log("🚀 Deploying SubQuery with ENV:", finalDeployEnv);
console.log("✅ Network set:", finalDeployEnv);
console.log("⚡ Build-time network embedded:", NETWORK);

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
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    lmkt: "0x2a2DfFe954225D6511740a0cc8ec92b944ca9181",
    paymentProcessor: "0x1AA8df52bE8b0b0898131E23592183687AC55E0b",
    listingManager: "0x6c5675343f3c1D9003746f7871DCdc2E73E85A5A",
    mDAI: "0x1E3fae53e2CbE163fEbFc8Ab2aA2E8c9C43bC736",
    chainId: "11155111",
    startBlock: 9226564,
  },
  pulse: {
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    treasury: "0xe12538Ab1990A3318395B7Cb0cE682741e68194E",
    lmkt: "0x2b5A9618Eb6886D23Dd7276B436ac98C20427716",
    paymentProcessor: "0xa659F4f1611297ed382703798cEd30ddD41A4004",
    listingManager: "0x48FEb85273B7BAc5c85C3B89C21D91BCC4deb621",
    mDAI: "0xb1bCAc95d4eEC3aD216aCD3261cc1845A193e590",
    chainId: "943",
    startBlock: 22610000,
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