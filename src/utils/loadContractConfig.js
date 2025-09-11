// src/contract-config.js
import ListingManagerABIJson from "../config/ListingManager.json";
import TreasuryABIJson from "../config/Treasury.json";
import LMKTABIJson from "../config/LMKT.json";
import PaymentProcessorABIJson from "../config/PaymentProcessor.json";
import GenericERC20ABIJson from "../config/GenericERC20.json";
import FaucetABIJson from "../config/Faucet.json";
import PriceOracleConsumerABIJson from "../config/PriceOracleConsumer.json";

// Normalize ABI import shape
const asAbi = (x) => (Array.isArray(x) ? x : x?.abi);
const ListingManagerABI = asAbi(ListingManagerABIJson);
const TreasuryABI = asAbi(TreasuryABIJson);
const LMKTABI = asAbi(LMKTABIJson);
const PaymentProcessorABI = asAbi(PaymentProcessorABIJson);
const GenericERC20ABI = asAbi(GenericERC20ABIJson);
const FaucetABI = asAbi(FaucetABIJson);
const PriceOracleConsumerABI = asAbi(PriceOracleConsumerABIJson);

const GLOB_A = import.meta.glob("../config/*/contract-addresses.json", {
  eager: true,
});
const GLOB_B = import.meta.glob("./config/*/contract-addresses.json", {
  eager: true,
});
const ADDRESS_FILES = { ...GLOB_A, ...GLOB_B };

// Find by suffix so absolute vs relative path differences don't matter
function getAddresses(networkName) {
  const suffix = `/config/${networkName}/contract-addresses.json`;
  const key = Object.keys(ADDRESS_FILES).find((k) => k.endsWith(suffix));

  if (!key) {
    console.error("Available address files:", Object.keys(ADDRESS_FILES));
    throw new Error(
      `No addresses file for network "${networkName}" (looking for *${suffix})`
    );
  }
  const mod = ADDRESS_FILES[key];
  return mod?.default ?? mod;
}

const pick = (obj, ...keys) => keys.map((k) => obj?.[k]).find(Boolean);
const need = (net, name, val) => {
  if (!val)
    throw new Error(
      `Missing address for "${name}" in ${net}/contract-addresses.json`
    );
  return val;
};

export function loadContractConfig(networkName) {
  const a = getAddresses(networkName);

  const listingManager = need(
    networkName,
    "ListingManager",
    pick(a, "ListingManager", "listingManager")
  );
  const treasury = need(
    networkName,
    "Treasury",
    pick(a, "Treasury", "treasury")
  );
  const lmkt = need(networkName, "LMKT", pick(a, "LMKT", "Lmkt"));
  const paymentProcessor = need(
    networkName,
    "PaymentProcessor",
    pick(a, "PaymentProcessor", "paymentProcessor")
  );
  const mockDai = need(
    networkName,
    "MockDai",
    pick(a, "MockDai", "MockDAI", "DAI", "MockERC20")
  );
  const faucet = need(
    networkName,
    "Faucet",
    pick(a, "Faucet", "faucet")
  );
  const priceOracle = pick(a, "PriceOracleConsumer", "MockPriceOracle");

  return {
    listingManagerConfig: { address: listingManager, abi: ListingManagerABI },
    treasuryConfig: { address: treasury, abi: TreasuryABI },
    lmktConfig: { address: lmkt, abi: LMKTABI },
    paymentProcessorConfig: {
      address: paymentProcessor,
      abi: PaymentProcessorABI,
    },
    mockDaiConfig: { address: mockDai, abi: GenericERC20ABI },
    faucetConfig: { address: faucet, abi: FaucetABI },
    priceOracleConsumerConfig: priceOracle
      ? { address: priceOracle, abi: PriceOracleConsumerABI }
      : undefined,
  };
}

// Optional alias for older imports
export const getContractConfigs = loadContractConfig;
export default loadContractConfig;
