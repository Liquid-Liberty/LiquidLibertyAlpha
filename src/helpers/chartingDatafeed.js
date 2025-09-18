// Simplified chartingDatafeed for demo purposes - MIGRATED TO SECURE SYSTEM
// Based on the main project's chartingDatafeed.ts
import { getStaticSubqueryConfig } from "../config/subgraph-config"; // Now secure

// Resolutions user can pick in TradingView and how we convert to subgraph seconds
export const SUPPORTED_RESOLUTIONS = ["1", "5", "15", "60", "240", "1D"];

const mapResolutionToSeconds = (resolution) => {
  if (resolution.endsWith("D")) return String(24 * 60 * 60); // 1 day
  const minutes = parseInt(resolution, 10);
  if (!isNaN(minutes)) return String(minutes * 60);
  // Fallback to 5m
  return "300";
};

// Mock websocket client for demo
class MockSocketIOClient {
  constructor() {}
  close() {}
}

const data_vars = {
  supported_resolutions: SUPPORTED_RESOLUTIONS,
  intraday_multipliers: ["1", "5", "15", "60", "240", "1440"],
  exchanges: [],
  symbols_types: [],
  supports_marks: true,
};

// Track realtime polling per subscriber (no mock data)
const subscriberIntervals = {};
const lastBarBySubscriber = {};

const getIntervalMs = (resolution) => {
  switch (resolution) {
    case "1S":
      return 1000;
    case "1":
      return 60 * 1000;
    case "5":
      return 5 * 60 * 1000;
    case "30":
      return 30 * 60 * 1000;
    case "60":
      return 60 * 60 * 1000;
    case "120":
      return 2 * 60 * 60 * 1000;
    case "360":
      return 6 * 60 * 60 * 1000;
    case "1D":
      return 24 * 60 * 60 * 1000;
    case "1W":
      return 7 * 24 * 60 * 60 * 1000;
    case "1M":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
};

// Enable compressing timeline (gapless). Keep off for production correctness
const COMPRESS_TIMELINE = false;

const subscriberState = {};

const cleanPairAddress = (addr) => {
  if (!addr) return addr;
  // If it's already prefixed (e.g., "943-0x..."), keep as-is
  if (/^\d+-0x[a-fA-F0-9]{40}$/.test(addr)) {
    return addr;
  }
  // Otherwise, return plain lowercase address
  return addr.toLowerCase();
};

export function GetDatafeedProvider(data, chainId) {
  console.log(`[Datafeed Init] chainId=${chainId}, pool=${data.poolAddress}`);

  // SECURE: Get validated configuration
  let PAIR_ADDRESS, URL, NETWORK_NAME, TREASURY_ADDRESS;
  try {
    const secureConfig = getStaticSubqueryConfig(chainId);
    ({ PAIR_ADDRESS, URL, NETWORK_NAME, TREASURY_ADDRESS } = secureConfig);

    console.log(`🔒 [Secure Config] network=${NETWORK_NAME}, chainId=${chainId}`);
    console.log(`🔒 [Secure Config] treasury=${TREASURY_ADDRESS}, pair=${PAIR_ADDRESS}`);
    console.log(`🔒 [Secure Config] url=${URL}`);

    // Validate we have the expected addresses for the network
    if (chainId === 943 && TREASURY_ADDRESS !== '0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2') {
      console.error(`🚨 Expected Pulse treasury 0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2, got ${TREASURY_ADDRESS}`);
    }
    if (chainId === 11155111 && TREASURY_ADDRESS !== '0x002144A5B56b6b3774774499B7AB04ED9E872dB9') {
      console.error(`🚨 Expected Sepolia treasury 0x002144A5B56b6b3774774499B7AB04ED9E872dB9, got ${TREASURY_ADDRESS}`);
    }
  } catch (error) {
    console.error("🚨 Secure datafeed config error:", error.message);
    throw new Error(`Datafeed configuration failed: ${error.message}`);
  }

  return {
    onReady: (callback) => {
      setTimeout(() => callback(data_vars));
    },

    searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
      onResultReadyCallback([]);
    },

    resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
      const PRICE_DECIMALS = 6; // 6 decimals -> tick = 0.000001
      const PRICE_SCALE = 10 ** PRICE_DECIMALS;

      const symbolInfo = {
        address: data.poolAddress,
        base_name: [`${data.baseSymbol}/${data.quoteSymbol}`],
        legs: [`${data.baseSymbol}/${data.quoteSymbol}`],
        dataType: "usd",
        full_name: data.baseSymbol,
        ticker: `${data.baseMint}`,
        name: `${data.baseSymbol}/${data.quoteSymbol}`,
        description: `${data.baseSymbol}/${data.quoteSymbol}`,
        data_status: "streaming",
        type: "Crypto",
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: "memetrend",
        minmov: 1,
        pricescale: PRICE_SCALE,
        has_intraday: true,
        visible_plots_set: "ohlcv",
        has_weekly_and_monthly: true,
        supported_resolutions: data_vars.supported_resolutions,
        volume24h: data.v24hUSD || 0,
        volume_precision: 6,
        has_no_volume: false,
        liquidity: data.liquidity,
        pairAddress: PAIR_ADDRESS || data.poolAddress, // Use secure config first
        source: "All pairs",
      };

      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    },

    getBars: async (
      symbolInfo,
      resolution,
      periodParams,
      onHistoryCallback,
      onErrorCallback
    ) => {
      try {
        // DEBUG: Log all available pair address sources
        console.log(`🔍 [PairAddress Debug] PAIR_ADDRESS from config: ${PAIR_ADDRESS}`);
        console.log(`🔍 [PairAddress Debug] symbolInfo?.pairAddress: ${symbolInfo?.pairAddress}`);
        console.log(`🔍 [PairAddress Debug] symbolInfo?.address: ${symbolInfo?.address}`);
        console.log(`🔍 [PairAddress Debug] data.poolAddress: ${data.poolAddress}`);

        const pairAddress = cleanPairAddress(
          PAIR_ADDRESS ||
            symbolInfo?.pairAddress ||
            symbolInfo?.address ||
            data.poolAddress
        );

        console.log(`🎯 [PairAddress Final] Using pairAddress: ${pairAddress}`);
        const intervalParam = mapResolutionToSeconds(resolution);

        // TradingView Charting Library passes from/to in seconds (not milliseconds)
        const fromSec = periodParams.from
          ? Math.floor(Number(periodParams.from))
          : 0;
        const toSec = periodParams.to ? Math.floor(Number(periodParams.to)) : 0;

        // Build time filter - include recent data by default
        const timeFilter =
          fromSec && toSec
            ? `bucketStart: { greaterThanOrEqualTo: ${fromSec}, lessThanOrEqualTo: ${toSec} },`
            : "";

        const query = `{
          candles(
            first: 1000,
            orderBy: BUCKET_START_ASC,
            filter: {
              pairId: { equalTo: "${pairAddress}" },
              interval: { equalTo: "${intervalParam}" },
              volumeToken0: { greaterThan: 0 },
              ${timeFilter}
            }
          ) {
            nodes {
              bucketStart
              open
              high
              low
              close
              volumeToken0
            }
          }
        }`;

        const doFetch = async (q, label = "primary") => {
          console.log(
            `[getBars] (${label}) chainId=${chainId}, using pairId=${pairAddress}, interval=${intervalParam}`
          );
          console.log(
            `[getBars] (${label}) Requested range: from=${fromSec} (${new Date(
              fromSec * 1000
            ).toISOString()}) to=${toSec} (${new Date(
              toSec * 1000
            ).toISOString()})`
          );

          const res = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, query: q }),
          });
          const json = await res.json();

          const candles = json?.data?.candles?.nodes ?? [];

          if (candles.length > 0) {
            const minTs = Math.min(
              ...candles.map((c) => parseInt(c.bucketStart))
            );
            const maxTs = Math.max(
              ...candles.map((c) => parseInt(c.bucketStart))
            );
            console.log(
              `[getBars] (${label}) Returned candles=${
                candles.length
              }, Actual time range: ${minTs} (${new Date(
                minTs * 1000
              ).toISOString()}) → ${maxTs} (${new Date(
                maxTs * 1000
              ).toISOString()})`
            );
          } else {
            console.log(`[getBars] (${label}) No candles returned`);
          }

          return candles;
        };

        // First try with time filter
        let candles = await doFetch(query);
        // Fallback: if no data returned, refetch without time filter but get most recent data
        if (!candles || candles.length === 0) {
          const fallbackQuery = `{
            candles(
              first: 1000,
              orderBy: BUCKET_START_DESC,
              filter: {
                pairId: { equalTo: "${pairAddress}" },
                interval: { equalTo: "${intervalParam}" },
                volumeToken0: { greaterThan: 0 }
              }
            ) {
              nodes {
                bucketStart
                open
                high
                low
                close
                volumeToken0
              }
            }
          }`;
          console.log(
            `[getBars] Fallback query - fetching most recent candles`
          );
          candles = await doFetch(fallbackQuery);
        }

        const allBars = (candles || [])
          .sort((a, b) => a.bucketStart - b.bucketStart)
          .map((c) => ({
            time: parseInt(c.bucketStart) * 1000, // ms
            low: parseFloat(c.low),
            high: parseFloat(c.high),
            open: parseFloat(c.open),
            close: parseFloat(c.close),
            volume: parseFloat(c.volumeToken0),
          }));

        const cutoffTs = 1757955600; // 2025-09-15T00:00:00Z
        const filteredBars = allBars.filter((b) => b.time >= cutoffTs * 1000);

        console.log(
          `[Processed bars] kept=${filteredBars.length}, dropped=${
            allBars.length - filteredBars.length
          }`
        );

        const nonEmptyBars = filteredBars.filter(
          (b) => Number.isFinite(b.volume) && b.volume > 0
        );

        // If we used fallback (no server-side timeFilter), apply client-side time window
        const barsInWindow =
          fromSec && toSec
            ? nonEmptyBars.filter(
                (b) => b.time >= fromSec * 1000 && b.time <= toSec * 1000
              )
            : nonEmptyBars;

        onHistoryCallback(barsInWindow, { noData: barsInWindow.length === 0 });
      } catch (error) {
        console.error("Error in getBars:", error);
        onErrorCallback(error);
      }
    },

    subscribeBars: (
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID
    ) => {
      // DEBUG: Log all available pair address sources for subscribeBars
      console.log(`🔍 [SubscribeBars Debug] PAIR_ADDRESS from config: ${PAIR_ADDRESS}`);
      console.log(`🔍 [SubscribeBars Debug] symbolInfo?.pairAddress: ${symbolInfo?.pairAddress}`);
      console.log(`🔍 [SubscribeBars Debug] symbolInfo?.address: ${symbolInfo?.address}`);
      console.log(`🔍 [SubscribeBars Debug] data.poolAddress: ${data.poolAddress}`);

      const pairAddress = cleanPairAddress(
        PAIR_ADDRESS ||
          symbolInfo?.pairAddress ||
          symbolInfo?.address ||
          data.poolAddress
      );

      console.log(`🎯 [SubscribeBars Final] Using pairAddress: ${pairAddress}`);
      const intervalParam = mapResolutionToSeconds(resolution);

      const poll = async () => {
        try {
          const query = `{
            candles(
              first: 1,
              orderBy: BUCKET_START_DESC,
              filter: {
                pairId: { equalTo: "${pairAddress}" },
                interval: { equalTo: "${intervalParam}" },
                volumeToken0: { greaterThan: 0 }
              }
            ) {
              nodes {
                bucketStart
                open
                high
                low
                close
                volumeToken0
              }
            }
          }`;

          const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, query }),
          });
          const { data: gql } = await response.json();
          const latest = gql?.candles?.nodes?.[0];
          if (!latest) return;

          // milliseconds
          const bar = {
            time: parseInt(latest.bucketStart) * 1000,
            low: parseFloat(latest.low),
            high: parseFloat(latest.high),
            open: parseFloat(latest.open),
            close: parseFloat(latest.close),
            volume: parseFloat(latest.volumeToken0),
          };

          // Skip emitting empty realtime candles (no volume)
          if (!Number.isFinite(bar.volume) || bar.volume <= 0) {
            return;
          }

          if (COMPRESS_TIMELINE) {
            const state = (subscriberState[subscriberUID] ||= {
              stepSec: Math.max(1, Math.floor(getIntervalMs(resolution))),
              lastOriginalTime: undefined,
              lastCompressedTime: undefined,
            });
            if (state.lastOriginalTime === undefined) {
              state.lastOriginalTime = bar.time;
              state.lastCompressedTime = bar.time;
            } else if (bar.time > state.lastOriginalTime) {
              state.lastCompressedTime =
                (state.lastCompressedTime || bar.time) + state.stepSec;
              state.lastOriginalTime = bar.time;
            }
            const outBar = {
              ...bar,
              time: state.lastCompressedTime ?? bar.time,
            };
            const prev = lastBarBySubscriber[subscriberUID];
            if (
              !prev ||
              prev.time !== outBar.time ||
              prev.close !== outBar.close ||
              prev.volume !== outBar.volume
            ) {
              lastBarBySubscriber[subscriberUID] = outBar;
              onRealtimeCallback(outBar);
            }
          } else {
            const prev = lastBarBySubscriber[subscriberUID];
            if (
              !prev ||
              prev.time !== bar.time ||
              prev.close !== bar.close ||
              prev.volume !== bar.volume
            ) {
              lastBarBySubscriber[subscriberUID] = bar;
              onRealtimeCallback(bar);
            }
          }
        } catch (e) {
          // swallow errors to keep polling
          console.error("Error polling latest candle:", e);
        }
      };

      // start polling
      poll();
      poll();
      const everyMs = 30 * 1000; // 30 seconds
      subscriberIntervals[subscriberUID] = window.setInterval(poll, everyMs);
      // const everyMs = Math.max(
      //   1000,
      //   Math.min(5000, Math.floor(getIntervalMs(resolution) / 2))
      // );
      subscriberIntervals[subscriberUID] = window.setInterval(poll, everyMs);
    },

    unsubscribeBars: (subscriberUID) => {
      if (subscriberIntervals[subscriberUID]) {
        window.clearInterval(subscriberIntervals[subscriberUID]);
        delete subscriberIntervals[subscriberUID];
      }
      if (lastBarBySubscriber[subscriberUID]) {
        delete lastBarBySubscriber[subscriberUID];
      }
      if (subscriberState[subscriberUID]) {
        delete subscriberState[subscriberUID];
      }
    },
  };
}
