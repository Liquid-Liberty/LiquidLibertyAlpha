// LMKT Configuration
import { SUBGRAPH_CONFIG } from './subgraph-config';

export const LMKT_CONFIG = {
    // Update this with your actual LMKT pair address from the subgraph
    PAIR_ADDRESS: SUBGRAPH_CONFIG.PAIR_ADDRESS,
    
    // Supported time intervals
    INTERVALS: ["60", "300", "900", "3600", "14400", "86400"],
    
    // Default interval
    DEFAULT_INTERVAL: "60",
    
    // Number of candles to fetch by default
    DEFAULT_CANDLE_LIMIT: 1000,
    
    // Token decimals (adjust if different)
    PRICE_DECIMALS: 8,
    VOLUME_DECIMALS: 18,
    
    // Chart colors
    COLORS: {
        close: "#10b981",    // Green
        high: "#ef4444",     // Red
        low: "#3b82f6",      // Blue
        open: "#f59e0b",     // Orange
        volume: "#8b5cf6"    // Purple
    }
};
