import addresses from './config/contract-addresses.json';
import ListingManagerABI from './config/ListingManager.json';
import TreasuryABI from './config/Treasury.json';
import LmktABI from './config/LMKT.json';
import PaymentProcessorABI from './config/PaymentProcessor.json';
import GenericERC20ABI from './config/GenericERC20.json';
import FaucetABI from './config/Faucet.json';
import PriceOracleConsumerABI from './config/PriceOracleConsumer.json';

export const listingManagerConfig = { address: addresses.ListingManager, abi: ListingManagerABI.abi };
export const treasuryConfig = { address: addresses.Treasury, abi: TreasuryABI.abi };
export const lmktConfig = { address: addresses.LMKT, abi: LmktABI.abi };
export const paymentProcessorConfig = { address: addresses.PaymentProcessor, abi: PaymentProcessorABI.abi };
export const faucetConfig = { address: addresses.Faucet, abi: FaucetABI.abi };
export const priceOracleConsumerConfig = { address: addresses.PriceOracleConsumer, abi: PriceOracleConsumerABI.abi };
export const mockDaiConfig = { address: addresses.MockDai, abi: GenericERC20ABI.abi };