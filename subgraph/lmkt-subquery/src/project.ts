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


// RPC URL selection
const rpcUrl = isLocal
  ? process.env.LOCAL_RPC_URL!
  : process.env.SEPOLIA_RPC_URL!;

// Treasury Address selection
const treasuryAddress = isLocal
  ? process.env.LOCAL_TREASURY_ADDRESS!
  : process.env.VITE_TREASURY_ADDRESS!;

// Can expand the Datasource processor types via the generic param
const project: EthereumProject= {
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
        chainId: isLocal ? "31337" : "11155111", //Hardhat vs Sepolia
        endpoint: rpcUrl,
    },
    dataSources: [
        {
            kind: EthereumDatasourceKind.Runtime,
            startBlock: isLocal ? 0 : 9118590,
            options: {
                abi : "Treasury",
                address : treasuryAddress,
            },
            assets: new Map([["Treasury",{"file":"./abis/Treasury.json"}],["ERC20",{"file":"./abis/ERC20.json"}]]),
            mapping:{
                file: "./dist/index.js",
                handlers:[
                    {
                        kind: EthereumHandlerKind.Event,
                        handler: "handleMKTSwap",
                        filter: {"topics":["MKTSwap(address,address,uint256,uint256,uint256,uint256,bool)",]},
                    },
                ]
            }
        },
    ],
    repository: "",
};

// Must set default to the project instance
export default project;
