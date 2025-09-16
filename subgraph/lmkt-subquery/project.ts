import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import * as dotenv from "dotenv";

// Point to the .env file in the root directory
dotenv.config({ path: '../../.env' });

// ==================================================================
// ========               CONFIGURATION                    ========
// ==================================================================

const deployEnv = (
  process.env.VITE_DEPLOY_ENV ||
  process.env.DEPLOY_ENV ||
  "sepolia"
).toLowerCase();

console.log("🛠️  Building SubQuery project for environment:", deployEnv);

function getEnv(name: string): string {
  const envVar = process.env[`${deployEnv.toUpperCase()}_${name}`];
  if (!envVar) {
    throw new Error(`❌ Missing environment variable: ${deployEnv.toUpperCase()}_${name}`);
  }
  return envVar;
}

const chainId = getEnv("CHAIN_ID") || (deployEnv === "sepolia" ? "11155111" : "943");
const rpcUrl = getEnv("RPC_URL");
const startBlock = parseInt(getEnv("START_BLOCK") || "0", 10);

const treasuryAddress = getEnv("TREASURY_ADDRESS");
const paymentProcessorAddress = getEnv("PAYMENT_PROCESSOR_ADDRESS");
const listingManagerAddress = getEnv("LISTING_MANAGER_ADDRESS");

// ==================================================================
// ========                 PROJECT DEFINITION             ========
// ==================================================================

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.6",
  name: `liquid-liberty-subquery-${deployEnv}`,
  description: "Indexer for fetching OHLCV data for TradingView price charts",
  runner: {
    node: { name: "@subql/node-ethereum", version: "*" },
    query: { name: "@subql/query", version: "*" },
  },
  schema: { file: "./schema.graphql" },
  network: {
    chainId,
    endpoint: rpcUrl,
  },
  dataSources: [
    // --- DATA SOURCE 1: Treasury (for price-setting swaps) ---
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "Treasury",
        address: treasuryAddress,
      },
      assets: new Map([
        ["Treasury", { file: "./abis/Treasury.json" }],
        ["ERC20", { file: "./abis/ERC20.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleMKTSwap",
            filter: {
              topics: [
                "MKTSwap(address,address,uint256,uint256,uint256,uint256,bool)",
              ],
            },
          },
        ],
      },
    },
    // --- DATA SOURCE 2: Payment Processor (for volume) ---
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "PaymentProcessor",
        address: paymentProcessorAddress,
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
    // --- DATA SOURCE 3: Listing Manager (for indirect price changes) ---
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock,
      options: {
        abi: "ListingManager",
        address: listingManagerAddress,
      },
      assets: new Map([
        ["ListingManager", { file: "./abis/ListingManager.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleListingFee", // Use one handler for both
            filter: {
              topics: ["ListingCreated(uint256,address,uint8,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleListingFee", // Use one handler for both
            filter: {
              topics: ["ListingRenewed(uint256,uint256)"],
            },
          },
        ],
      },
    },
  ],
  repository: "",
};

export default project;