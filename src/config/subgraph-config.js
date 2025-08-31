// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.1.3",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0x4d006478b095f51dad682578f51624992988122a",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
