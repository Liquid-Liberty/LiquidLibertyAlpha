import addresses from './config/contract-addresses.json';
import ListingManagerABI from './config/ListingManager.json';
import TreasuryABI from './config/Treasury.json';
import LmktABI from './config/LMKT.json';
import PaymentProcessorABI from './config/PaymentProcessor.json';
import GenericERC20ABI from './config/GenericERC20.json';
import FaucetABI from './config/Faucet.json';
import PriceOracleConsumerABI from './config/PriceOracleConsumer.json';

export const listingManagerConfig = { address: addresses.listingManager, abi: ListingManagerABI.abi };
export const treasuryConfig = { address: addresses.treasury, abi: TreasuryABI.abi };
export const lmktConfig = { address: addresses.lmkt, abi: LmktABI.abi };
export const paymentProcessorConfig = { address: addresses.paymentProcessor, abi: PaymentProcessorABI.abi };
export const faucetConfig = { address: addresses.faucet, abi: FaucetABI.abi };
export const priceOracleConsumerConfig = { address: addresses.priceOracleConsumer, abi: PriceOracleConsumerABI.abi };
export const mockDaiConfig = { address: addresses.mockDai, abi: GenericERC20ABI.abi };
export const mockWethConfig = { address: addresses.mockWeth, abi: GenericERC20ABI.abi };
export const mockWbtcConfig = { address: addresses.mockWbtc, abi: GenericERC20ABI.abi };
export const mockPlsConfig = { address: addresses.mockPls, abi: GenericERC20ABI.abi };