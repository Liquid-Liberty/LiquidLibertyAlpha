require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // hardhat: {
    //   chainId: 11155111,
    // },
    // baseSepolia: {
    //   url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 84532,
    //   verify: {
    //     etherscan: {
    //       apiUrl: "https://api.etherscan.io/v2/api?chainid=84532",
    //       apiKey: "ZI26NVK39E6I1DSKK6U9ASTVIKR8QDBA3S",
    //     },
    //   },
    // },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.SIGNER_PRIVATE_KEY ? [process.env.SIGNER_PRIVATE_KEY] : [],
      chainId: 11155111,
      verify: {
        etherscan: {
          apiUrl: "https://ethereum-sepolia-rpc.publicnode.com",
          apiKey: process.env.SEPOLIA_API_KEY || "",
        },
      },
      gas: 2100000,
      gasPrice: 800000000,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.SEPOLIA_API_KEY,
    },
  },
}; 