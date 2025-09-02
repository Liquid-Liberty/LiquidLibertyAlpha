// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.1.7",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0x7c4ae0e3a6e0e37368054674c16e9fbf46784d90",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
