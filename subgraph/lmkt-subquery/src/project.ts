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

// Treasury Address selection
const treasuryAddress = isLocal
  ? process.env.LOCAL_TREASURY_ADDRESS!
  : isSepolia
  ? process.env.VITE_TREASURY_ADDRESS!
  : process.env.PULSECHAIN_TREASURY_ADDRESS!;

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.5",
  name: "liquid-liberty-subquery",
  description: "Subgraph for fetching OHLCV data for TradingView price charts",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: "6.2.1",
    },
    query: {
      name: "@subql/query",
      version: "2.23.5",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    chainId: isLocal
      ? "31337"
      : isSepolia
      ? "11155111" // Sepolia
      : "943", // Pulse testnet (replace with mainnet if needed)
    endpoint: rpcUrl,
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: isLocal ? 0 : isSepolia ? 9176744 : 22602590, // adjust Pulse start block
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
  ],
  repository: "",
};

// Must set default to the project instance
export default project;
