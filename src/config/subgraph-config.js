// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.4",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xf46c7c417c1ec1efa9240c6c1ecff293555f327f",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
