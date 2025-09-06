  // SubQuery endpoint via netlify function proxy

export const SUBQUERY_CONFIG = {
    URL: "/.netlify/functions/subquery-proxy",
    PAIR_ADDRESS: import.meta.env.VITE_TREASURY_ADDRESS.toLowerCase(),

    // Default fetch options
    DEFAULT_INTERVAL: "60", // 1 minute candles
    DEFAULT_CANDLE_LIMIT: 100,
};
