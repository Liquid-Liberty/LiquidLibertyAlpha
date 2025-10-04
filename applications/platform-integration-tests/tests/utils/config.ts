/**
 * Test configuration utilities
 */

export const config = {
  monorepo: {
    frontendUrl: process.env.MONOREPO_FRONTEND_URL || 'http://localhost:5173',
    apiUrl: process.env.MONOREPO_API_URL || 'http://localhost:8888/.netlify/functions',
    rpcUrl: process.env.MONOREPO_CONTRACTS_RPC || 'http://localhost:8545',
    subqueryUrl: process.env.MONOREPO_SUBQUERY_URL || 'http://localhost:3000',
  },
  applications: {
    frontendUrl: process.env.APPLICATIONS_FRONTEND_URL || 'http://localhost:5174',
    apiUrl: process.env.APPLICATIONS_API_URL || 'http://localhost:8889/.netlify/functions',
    rpcUrl: process.env.APPLICATIONS_CONTRACTS_RPC || 'http://localhost:8546',
    subqueryUrl: process.env.APPLICATIONS_SUBQUERY_URL || 'http://localhost:3001',
  },
  test: {
    walletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY || '',
    timeout: parseInt(process.env.TEST_TIMEOUT || '60000', 10),
    ipfsGateway: process.env.TEST_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  },
};

export const networks = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || '',
    chainId: 11155111,
  },
  pulse: {
    rpcUrl: process.env.PULSE_RPC_URL || '',
    chainId: 943,
  },
  localhost: {
    rpcUrl: 'http://localhost:8545',
    chainId: 31337,
  },
};
