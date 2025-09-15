import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";
import * as dotenv from "dotenv";
dotenv.config();

const deployEnv =
  process.env.VITE_DEPLOY_ENV || process.env.DEPLOY_ENV || "sepolia";

console.log("Deploying SubQuery with ENV:", deployEnv);

const isLocal = deployEnv === "local";
const isSepolia = deployEnv === "sepolia";
const isPulse = deployEnv === "pulse";

// RPC URL
const rpcUrl = isLocal
  ? process.env.LOCAL_RPC_URL!
  : isSepolia
  ? process.env.SEPOLIA_RPC_URL!
  : isPulse
  ? process.env.PULSE_RPC_URL!
  : (() => {
      throw new Error(`Unknown deployEnv: ${deployEnv}`);
    })();

const treasuryAddress = isLocal
  ? process.env.LOCAL_TREASURY_ADDRESS!
  : isSepolia
  ? process.env.SEPOLIA_TREASURY_ADDRESS!
  : isPulse
  ? process.env.PULSE_TREASURY_ADDRESS!
  : (() => {
      throw new Error(`Unknown deployEnv: ${deployEnv}`);
    })();

const lmktAddress = isLocal
  ? process.env.LOCAL_LMKT_ADDRESS!
  : isSepolia
  ? process.env.SEPOLIA_LMKT_ADDRESS!
  : isPulse
  ? process.env.PULSE_LMKT_ADDRESS!
  : (() => {
      throw new Error(`Unknown deployEnv: ${deployEnv}`);
    })();

const chainId = isLocal
  ? "31337"
  : isSepolia
  ? "11155111"
  : isPulse
  ? "943"
  : (() => {
      throw new Error(`Unknown deployEnv: ${deployEnv}`);
    })();

const startBlock = isLocal
  ? 0
  : isSepolia
  ? 9176744
  : isPulse
  ? 22602590
  : (() => {
      throw new Error(`Unknown deployEnv: ${deployEnv}`);
    })();

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.5",
  name: `liquid-liberty-subquery-${deployEnv}`,
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
  ],
  repository: "",
};

export default project;
