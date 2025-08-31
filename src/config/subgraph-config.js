// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.0.7",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
