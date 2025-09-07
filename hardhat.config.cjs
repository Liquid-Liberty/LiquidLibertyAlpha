// contracts/hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const { ACCOUNT_PRIVATE_KEY } = process.env;

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
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: ACCOUNT_PRIVATE_KEY ? [ACCOUNT_PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.SIGNER_PRIVATE_KEY
        ? [process.env.SIGNER_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
    pulse: {
      url: process.env.PULSECHAIN_RPC_URL,
      accounts: process.env.SIGNER_PRIVATE_KEY
      ? [process.env.SIGNER_PRIVATE_KEY]
        : [],
      chainId: 943,
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.SEPOLIA_API_KEY,
    },
  },
};
