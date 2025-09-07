// contract-config.js
import { loadContractConfig } from './utils/loadContractConfig';

// Utility function to get all configs dynamically
export async function getContractConfigs(networkName) {
  if (!networkName) {
    throw new Error("No network name provided to getContractConfigs");
  }

  const config = await loadContractConfig(networkName);

  return {
    listingManagerConfig: config.listingManagerConfig,
    treasuryConfig: config.treasuryConfig,
    lmktConfig: config.lmktConfig,
    paymentProcessorConfig: config.paymentProcessorConfig,
    faucetConfig: config.faucetConfig,
    priceOracleConsumerConfig: config.priceOracleConsumerConfig,
    mockDaiConfig: config.mockDaiConfig,
  };
}
