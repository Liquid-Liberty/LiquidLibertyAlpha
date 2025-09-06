export async function loadContractConfig(networkName) {
  if (!networkName) {
    throw new Error("No network name provided to loadContractConfig");
  }

  try {
    const [
      addresses,
      ListingManagerABI,
      TreasuryABI,
      LMKTABI,
      PaymentProcessorABI,
      GenericERC20ABI,
      FaucetABI,
      PriceOracleConsumerABI
    ] = await Promise.all([
      import(`../config/${networkName}/contract-addresses.json`),
      import(`../config/${networkName}/ListingManager.json`),
      import(`../config/${networkName}/Treasury.json`),
      import(`../config/${networkName}/LMKT.json`),
      import(`../config/${networkName}/PaymentProcessor.json`),
      import(`../config/${networkName}/GenericERC20.json`),
      import(`../config/${networkName}/Faucet.json`),
      import(`../config/${networkName}/PriceOracleConsumer.json`),
    ]);

    return {
      listingManagerConfig: {
        address: addresses.default.ListingManager,
        abi: ListingManagerABI.default.abi,
      },
      treasuryConfig: {
        address: addresses.default.Treasury,
        abi: TreasuryABI.default.abi,
      },
      lmktConfig: {
        address: addresses.default.LMKT,
        abi: LMKTABI.default.abi,
      },
      paymentProcessorConfig: {
        address: addresses.default.PaymentProcessor,
        abi: PaymentProcessorABI.default.abi,
      },
      faucetConfig: {
        address: addresses.default.Faucet,
        abi: FaucetABI.default.abi,
      },
      mockDaiConfig: {
        address: addresses.default.MockDai,
        abi: GenericERC20ABI.default.abi,
      },
      priceOracleConsumerConfig: {
        address: addresses.default.MockPriceOracle,
        abi: PriceOracleConsumerABI.default.abi,
      },
    };
  } catch (error) {
    console.error(`❌ Failed to load contract config for network: ${networkName}`);
    throw error;
  }
}
