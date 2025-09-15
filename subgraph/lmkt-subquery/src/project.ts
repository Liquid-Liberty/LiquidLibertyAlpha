// Auto-generated , please modify to ensure correctness

import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import * as dotenv from "dotenv";
dotenv.config();

const deployEnv = process.env.VITE_DEPLOY_ENV || "sepolia";

const isLocal = deployEnv === "local";
const isSepolia = deployEnv === "sepolia";
const isPulse = deployEnv === "pulse";

// RPC URL selection
const rpcUrl = isLocal
  ? process.env.LOCAL_RPC_URL!
  : isSepolia
  ? process.env.SEPOLIA_RPC_URL!
  : process.env.PULSECHAIN_RPC_URL!;

// Address selection
const treasuryAddress = isLocal
  ? process.env.LOCAL_TREASURY_ADDRESS!
  : isSepolia
  ? process.env.VITE_TREASURY_ADDRESS!
  : process.env.PULSECHAIN_TREASURY_ADDRESS!;

const paymentProcessorAddress = isLocal
  ? process.env.LOCAL_PAYMENT_PROCESSOR_ADDRESS!
  : isSepolia
  ? process.env.VITE_PAYMENT_PROCESSOR_ADDRESS!
  : process.env.PULSECHAIN_PAYMENT_PROCESSOR_ADDRESS!;

const listingManagerAddress = isLocal
  ? process.env.LOCAL_LISTING_MANAGER_ADDRESS!
  : isSepolia
  ? process.env.VITE_LISTING_MANAGER_ADDRESS!
  : process.env.PULSECHAIN_LISTING_MANAGER_ADDRESS!;

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.6", // Incremented version
  name: "liquid-liberty-subquery",
  description: "Subgraph for fetching OHLCV data for TradingView price charts",
  runner: {
    node: { name: "@subql/node-ethereum", version: "6.2.1" },
    query: { name: "@subql/query", version: "2.23.5" },
  },
  schema: { file: "./schema.graphql" },
  network: {
    chainId: isLocal ? "31337" : isSepolia ? "11155111" : "943",
    endpoint: rpcUrl,
  },
  dataSources: [
    // Datasource 1: Treasury
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: isLocal ? 0 : isSepolia ? 9176744 : 22602590,
      options: { abi: "Treasury", address: treasuryAddress },
      assets: new Map([["Treasury", { file: "./abis/Treasury.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleMKTSwap",
            filter: { topics: ["MKTSwap(address,address,uint256,uint256,uint256,uint256,bool)"] },
          },
        ],
      },
    },
    // Datasource 2: Payment Processor
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: isLocal ? 0 : isSepolia ? 9176744 : 22602590,
      options: { abi: "PaymentProcessor", address: paymentProcessorAddress },
      assets: new Map([["PaymentProcessor", { file: "./abis/PaymentProcessor.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePurchaseMade",
            filter: { topics: ["PurchaseMade(uint256,address,address,uint256)"] },
          },
        ],
      },
    },
    // ✅ Datasource 3: Listing Manager
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: isLocal ? 0 : isSepolia ? 9176744 : 22602590, // Match other startBlocks or use the contract deployment block
      options: { abi: "ListingManager", address: listingManagerAddress },
      assets: new Map([["ListingManager", { file: "./abis/ListingManager.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleListingCreated",
            filter: { topics: ["ListingCreated(uint256,address,uint8,uint256)"] },
          },
        ],
      },
    },
  ],
  repository: "",
};

export default project;