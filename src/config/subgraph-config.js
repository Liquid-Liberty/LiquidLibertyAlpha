// Subgraph + Pair configuration

export const SUBQUERY_CONFIG = {
  // TheGraph endpoint
    URL: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",

    // The Treasury contract being tracked
    PAIR_ADDRESS: "0x28d95bfd1131abf3f76236962f39264e137cd5c5",

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
