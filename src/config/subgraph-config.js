// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.3",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xF46c7c417C1EC1fEA9240C6c1EcF293555F327f",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
