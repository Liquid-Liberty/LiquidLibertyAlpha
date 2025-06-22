// src/contract-config.js

export const contractConfig = {
  marketplace: {
    address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    abi: [
      {
        "inputs": [
          { "internalType": "address", "name": "_treasury", "type": "address" },
          { "internalType": "address", "name": "_lbrtyToken", "type": "address" },
          { "internalType": "address", "name": "_lmktToken", "type": "address" },
          { "internalType": "address", "name": "_lbrtyPriceFeed", "type": "address" },
          { "internalType": "address", "name": "_lmktPriceFeed", "type": "address" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "DisputeStarted", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "lmktAmount", "type": "uint256" }], "name": "FundsReleased", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }, { "indexed": false, "internalType": "string", "name": "listingType", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }, { "indexed": false, "internalType": "bool", "name": "isPricedInUsd", "type": "bool" }], "name": "ListingCreated", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "ListingDeleted", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "ListingUpdated", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "lmktAmount", "type": "uint256" }], "name": "PurchaseMade", "type": "event" },
      { "inputs": [], "name": "ITEM_FEE_USD", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "LBRTY_ACCESS_THRESHOLD_USD", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "LISTING_DURATION", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "SERVICE_FEE_USD", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "buy", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "string", "name": "listingType", "type": "string" }, { "internalType": "string", "name": "title", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "ipfsHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isPricedInUsd", "type": "bool" }, { "internalType": "address", "name": "feePaymentToken", "type": "address" }, { "internalType": "string", "name": "zipCode", "type": "string" }, { "internalType": "string", "name": "deliveryMethod", "type": "string" }, { "internalType": "string", "name": "shippingCost", "type": "string" }, { "internalType": "string", "name": "rateType", "type": "string" }, { "internalType": "string", "name": "serviceCategory", "type": "string" }], "name": "createListing", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "escrows", "outputs": [{ "internalType": "address", "name": "buyer", "type": "address" }, { "internalType": "address", "name": "seller", "type": "address" }, { "internalType": "uint256", "name": "lmktAmount", "type": "uint256" }, { "internalType": "address", "name": "paymentToken", "type": "address" }, { "internalType": "string", "name": "status", "type": "string" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "getActiveListings", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "seller", "type": "address" }, { "internalType": "string", "name": "listingType", "type": "string" }, { "internalType": "string", "name": "title", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "ipfsHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isPricedInUsd", "type": "bool" }, { "internalType": "uint256", "name": "expiration", "type": "uint256" }, { "internalType": "bool", "name": "active", "type": "bool" }, { "internalType": "string", "name": "zipCode", "type": "string" }, { "internalType": "string", "name": "deliveryMethod", "type": "string" }, { "internalType": "string", "name": "shippingCost", "type": "string" }, { "internalType": "string", "name": "rateType", "type": "string" }, { "internalType": "string", "name": "serviceCategory", "type": "string" }], "internalType": "struct Marketplace.Listing[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "getListing", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "seller", "type": "address" }, { "internalType": "string", "name": "listingType", "type": "string" }, { "internalType": "string", "name": "title", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "ipfsHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isPricedInUsd", "type": "bool" }, { "internalType": "uint256", "name": "expiration", "type": "uint256" }, { "internalType": "bool", "name": "active", "type": "bool" }, { "internalType": "string", "name": "zipCode", "type": "string" }, { "internalType": "string", "name": "deliveryMethod", "type": "string" }, { "internalType": "string", "name": "shippingCost", "type": "string" }, { "internalType": "string", "name": "rateType", "type": "string" }, { "internalType": "string", "name": "serviceCategory", "type": "string" }], "internalType": "struct Marketplace.Listing", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lbrtyPriceFeed", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lbrtyToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "listings", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "seller", "type": "address" }, { "internalType": "string", "name": "listingType", "type": "string" }, { "internalType": "string", "name": "title", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "ipfsHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isPricedInUsd", "type": "bool" }, { "internalType": "uint256", "name": "expiration", "type": "uint256" }, { "internalType": "bool", "name": "active", "type": "bool" }, { "internalType": "string", "name": "zipCode", "type": "string" }, { "internalType": "string", "name": "deliveryMethod", "type": "string" }, { "internalType": "string", "name": "shippingCost", "type": "string" }, { "internalType": "string", "name": "rateType", "type": "string" }, { "internalType": "string", "name": "serviceCategory", "type": "string" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lmktPriceFeed", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lmktToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "uint256", "name": "listingId", "type": "uint256" }], "name": "releaseFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "address", "name": "priceFeed", "type": "address" }], "name": "setWhitelistedToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "treasury", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "whitelistedPriceFeeds", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }
    ]
  },
  lmkt: {
    address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    abi: [
      { "inputs": [{ "internalType": "address", "name": "initialOwner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
      { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
      { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ]
  },
  treasury: {
    address: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    abi: [
      { "inputs": [{ "internalType": "address", "name": "_lmktToken", "type": "address" }, { "internalType": "address", "name": "_dexRouter", "type": "address" }, { "internalType": "address", "name": "_lmktPriceFeed", "type": "address" }, { "internalType": "address", "name": "initialOwner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
      { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
      { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "AdminTokenTransfer", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "collateralToken", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "collateralAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "lmktAmount", "type": "uint256" }], "name": "LiquidityProvided", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }, { "indexed": true, "internalType": "address", "name": "collateralToken", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "collateralAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "lmktAmount", "type": "uint256" }], "name": "MktPurchased", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RevenueReceived", "type": "event" },
      { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "priceFeed", "type": "address" }], "name": "WhitelistedTokenSet", "type": "event" },
      { "inputs": [{ "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "adminTransfer", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "collateralToken", "type": "address" }, { "internalType": "uint256", "name": "amountCollateral", "type": "uint256" }], "name": "buyMkt", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "depositRevenue", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "dexRouter", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lmktPriceFeed", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "lmktToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "collateralToken", "type": "address" }], "name": "provideLiquidity", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "address", "name": "priceFeed", "type": "address" }], "name": "setWhitelistedToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "whitelistedPriceFeeds", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
      { "stateMutability": "payable", "type": "receive" }
    ]
  },
  faucet: {
    address: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
    abi: [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_daiAddr",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_wethAddr",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_wbtcAddr",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_plsAddr",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "TokensClaimed",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "DAI_AMOUNT",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "PLS_AMOUNT",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "WBTC_AMOUNT",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "WETH_AMOUNT",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "hasClaimed",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "mockDaiToken",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "mockPlsToken",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "mockWbtcToken",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "mockWethToken",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "requestTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  }
};