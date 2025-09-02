// Subgraph + Pair configuration

export const SUBGRAPH_CONFIG = {
  // TheGraph endpoint
    URL: "https://api.studio.thegraph.com/query/119680/liberty-market-alpha/v0.1.5",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0xc2eec2d9cfd7d29f498a4aed6dB227d68d013c53",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
