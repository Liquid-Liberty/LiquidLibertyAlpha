// MIGRATED TO SECURE SYSTEM
import { getSecureSubqueryConfig } from '../config/secureSubgraphConfig.js';

export const fetchFromSubgraph = async (query, variables = {}, chainId = null) => {
    try {
        // SECURE: Validate chainId is provided - no defaults to prevent wrong network queries
        if (!chainId) {
            throw new Error('🚨 chainId is required for secure subgraph queries. Ensure useChainId() from wagmi is properly connected.');
        }

        const finalChainId = parseInt(chainId);
        if (isNaN(finalChainId)) {
            throw new Error(`🚨 Invalid chainId: ${chainId}. Must be a valid number.`);
        }

        const secureConfig = getSecureSubqueryConfig(finalChainId);


        // Include chainId in the request body for the proxy to route correctly
        const requestBody = {
            query,
            variables,
            chainId: finalChainId
        };

        const response = await fetch(secureConfig.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        return data.data;
    } catch (error) {
        console.error('Error fetching from subgraph:', error);
        throw error;
    }
};

/**
 * Fetch LMKT token OHLCV data for chart display
 * @param {string} pairAddress - The pair address for LMKT
 * @param {string} interval - Time interval (e.g., "1h", "4h", "1d")
 * @param {number} limit - Number of candles to fetch (default: 100)
 * @param {number} chainId - Chain ID to determine which network to query
 * @returns {Promise<Array>} - Array of OHLCV data points
 */
export const fetchLMKTData = async (pairAddress, interval, limit = 1000, chainId) => {
    // SECURE: Validate required parameters
    if (!chainId) {
        throw new Error('🚨 chainId is required for fetchLMKTData. Pass chainId from useChainId() hook.');
    }
    const query = `{
          candles(
            first: 100, 
            orderBy: bucketStart, 
            orderDirection: asc, 
            where: {pair: "${pairAddress}", interval: "${interval}"}
          ) {
            bucketStart
            open
            high
            low
            close
            volumeToken0
            volumeToken1
            trades
          }
        }`;

    try {
        const data = await fetchFromSubgraph(query, {
            limit,
            pairAddress,
            interval
        }, chainId);
        
        // Transform the data to match our chart format
        if (data.candles) {
            return data.candles.map(candle => ({
                timestamp: new Date(parseInt(candle.bucketStart) * 1000).toISOString().split('T')[0],
                open: parseFloat(candle.open), // Assuming 8 decimals for price
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close),
                volume: parseFloat(candle.volumeToken0), // Assuming 18 decimals for volume
                trades: parseInt(candle.trades)
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching LMKT candles:', error);
        throw error;
    }
};

/**
 * Fetch current LMKT token stats from latest candle
 * @param {string} pairAddress - The pair address for LMKT
 * @param {number} chainId - Chain ID to determine which network to query
 * @returns {Promise<Object>} - Current token statistics
 */
export const fetchLMKTCurrentStats = async (pairAddress, chainId) => {
    // SECURE: Validate required parameters
    if (!chainId) {
        throw new Error('🚨 chainId is required for fetchLMKTCurrentStats. Pass chainId from useChainId() hook.');
    }
    const query = `
        query GetLMKTCurrentStats($pairAddress: String!) {
            candles(
                first: 1, 
                orderBy: bucketStart, 
                orderDirection: desc, 
                where: {pair: ${pairAddress}, interval: "60"}
            ) {
                bucketStart
                open
                high
                low
                close
                volumeToken0
                volumeToken1
                trades
            }
        }
    `;

    try {
        const data = await fetchFromSubgraph(query, { pairAddress }, chainId);
        
        if (data.candles && data.candles.length > 0) {
            const latestCandle = data.candles[0];
            return {
                price: parseFloat(latestCandle.close) / 1e8,
                volume24h: parseFloat(latestCandle.volumeToken0) / 1e18,
                high: parseFloat(latestCandle.high) / 1e8,
                low: parseFloat(latestCandle.low) / 1e8,
                open: parseFloat(latestCandle.open) / 1e8,
                trades: parseInt(latestCandle.trades)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching LMKT current stats:', error);
        throw error;
    }
};

/**
 * Fetch LMKT trading history
 * @param {number} limit - Number of trades to fetch (default: 100)
 * @returns {Promise<Array>} - Array of trade data
 */
export const fetchLMKTTrades = async (limit = 100) => {
    const query = `
        query GetLMKTTrades($limit: Int!) {
            # Replace with your actual entity names and fields
            # Example: trades(first: $limit, orderBy: timestamp, orderDirection: desc) {
            #     timestamp
            #     amount
            #     price
            #     type
            #     user
            # }
            
            # For now, returning empty array - implement based on your schema
            trades(first: $limit, orderBy: timestamp, orderDirection: desc) {
                timestamp
                amount
                price
                type
                user
            }
        }
    `;

    try {
        const data = await fetchFromSubgraph(query);
        
        if (data.trades) {
            return data.trades.map(trade => ({
                timestamp: new Date(parseInt(trade.timestamp) * 1000).toISOString(),
                amount: parseFloat(trade.amount) / 1e18,
                price: parseFloat(trade.price) / 1e8,
                type: trade.type,
                user: trade.user,
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching LMKT trades:', error);
        throw error;
    }
};
