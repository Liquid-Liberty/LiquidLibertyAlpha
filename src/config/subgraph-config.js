// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/version/latest",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xe758e36476376ccddf574144ab3e9a560d550de3",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
