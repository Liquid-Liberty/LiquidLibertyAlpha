import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

// Default to sepolia if nothing is set
const deployEnv = (process.env.VITE_DEPLOY_ENV || "sepolia").toLowerCase();

console.log("Deploying SubQuery with ENV:", deployEnv);

const config = {
  local: {
    rpcUrl: "http://localhost:8545",
    treasury: "0x0000000000000000000000000000000000000000",
    lmkt: "0x0000000000000000000000000000000000000000",
    chainId: "31337",
    startBlock: 0,
  },
  sepolia: {
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
    treasury: "0xC78b685192DD8164062705Cd8148df2CB2d1CB9E",
    lmkt: "0xE5De8015E7cd41F5d053461EDA9480CF3dA4f358",
    chainId: "11155111",
    startBlock: 9176744,
  },
  pulse: {
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    treasury: "0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a",
    lmkt: "0x8e1f781763D550adDAA9F1869B6bae3f86e87b4F",
    chainId: "943",
    startBlock: 22602590,
  },
} as const;

if (!(deployEnv in config)) {
  throw new Error(
    `❌ Unknown deployEnv: ${deployEnv} (expected 'local' | 'sepolia' | 'pulse')`
  );
}

const { rpcUrl, treasury, lmkt, chainId, startBlock } = config[
  deployEnv as keyof typeof config
];

console.log("  → RPC URL:", rpcUrl);
console.log("  → Treasury Address:", treasury);
console.log("  → LMKT Address:", lmkt);
console.log("  → Chain ID:", chainId);
console.log("  → Start Block:", startBlock);

if (
  !rpcUrl ||
  !treasury ||
  !lmkt ||
  !chainId ||
  startBlock === undefined
) {
  throw new Error(`❌ Missing env vars for ${deployEnv}:
    rpcUrl=${rpcUrl}
    treasuryAddress=${treasury}
    lmktAddress=${lmkt}
    chainId=${chainId}
    startBlock=${startBlock}`);
}

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
        address: treasury,
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
          },
        ],
      },
    },
  ],
  repository: "",
};

export const TREASURY_ADDRESS = treasury.toLowerCase();
export const LMKT_ADDRESS = lmkt.toLowerCase();

export default project;
