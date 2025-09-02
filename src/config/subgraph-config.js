// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.1.8",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0x28d95bfd1131abf3f76236962f39264e137cd5c5",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
