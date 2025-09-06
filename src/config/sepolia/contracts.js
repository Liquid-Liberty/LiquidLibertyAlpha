import addresses from './contract-addresses.json';
import listingManagerAbi from '../ListingManager.json';
import paymentProcessorAbi from '../PaymentProcessor.json';
import treasuryAbi from '../Treasury.json';
import lmktAbi from '../LMKT.json';
import mockDaiAbi from '../GenericERC20.json'; // MockDai uses the GenericERC20 ABI
import faucetAbi from '../Faucet.json';

export const listingManagerConfig = {
  address: addresses.ListingManager,
  abi: listingManagerAbi.abi,
};

export const paymentProcessorConfig = {
  address: addresses.PaymentProcessor,
  abi: paymentProcessorAbi.abi,
};

export const treasuryConfig = {
  address: addresses.Treasury,
  abi: treasuryAbi.abi,
};

export const lmktConfig = {
  address: addresses.LMKT,
  abi: lmktAbi.abi,
};

export const mockDaiConfig = {
  address: addresses.MockDai,
  abi: mockDaiAbi.abi,
};

export const faucetConfig = {
  address: addresses.Faucet,
  abi: faucetAbi.abi,
};