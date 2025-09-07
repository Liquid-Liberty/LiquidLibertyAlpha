// Vite-friendly dynamic loader for per-network addresses + shared ABIs

import ListingManagerABI from "../config/ListingManager.json";
import TreasuryABI from "../config/Treasury.json";
import LMKTABI from "../config/LMKT.json";
import PaymentProcessorABI from "../config/PaymentProcessor.json";
import GenericERC20ABI from "../config/GenericERC20.json";
import FaucetABI from "../config/Faucet.json";
import PriceOracleConsumerABI from "../config/PriceOracleConsumer.json";

// Eagerly import all network address files; Vite will include them in the bundle
const ADDRESS_FILES = import.meta.glob(
  "../config/*/contract-addresses.json",
  { eager: true }
);

// Helper to fetch the right addresses module by network name
function getAddresses(networkName) {
  const path = `../config/${networkName}/contract-addresses.json`;
  const mod = ADDRESS_FILES[path];
  if (!mod) {
    console.error("Available address files:", Object.keys(ADDRESS_FILES));
    throw new Error(
      `No addresses file for network "${networkName}" at ${path}`
    );
  }
  // Vite JSON modules are under .default
  return mod.default ?? mod;
}

export async function loadContractConfig(networkName) {
  const addresses = getAddresses(networkName);

  return {
    listingManagerConfig: {
      address: addresses.ListingManager,
      abi: ListingManagerABI.abi,
    },
    treasuryConfig: {
      address: addresses.Treasury,
      abi: TreasuryABI.abi,
    },
    lmktConfig: {
      address: addresses.LMKT,
      abi: LMKTABI.abi,
    },
    paymentProcessorConfig: {
      address: addresses.PaymentProcessor,
      abi: PaymentProcessorABI.abi,
    },
    mockDaiConfig: {
      address: addresses.MockDai,
      abi: GenericERC20ABI.abi,
    },
    faucetConfig: {
      address: addresses.Faucet,
      abi: FaucetABI.abi,
    },
    // Support either "MockPriceOracle" or "PriceOracleConsumer" in your addresses JSON
    priceOracleConsumerConfig: {
      address:
        addresses.PriceOracleConsumer ?? addresses.MockPriceOracle ?? null,
      abi: PriceOracleConsumerABI.abi,
    },
  };
}
