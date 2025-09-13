// Simplified chartingDatafeed for demo purposes
// Based on the main project's chartingDatafeed.ts
import { SUBQUERY_CONFIG } from "../config/subgraph-config";
import { getStaticSubqueryConfig } from "../config/subgraph-config";

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

export function GetDatafeedProvider(data, chainId) {
  console.log(`[Datafeed Init] chainId=${chainId}, pool=${data.poolAddress}`);
  const { PAIR_ADDRESS, URL } = getStaticSubqueryConfig(chainId);
  console.log(`[Config] chainId=${chainId}, resolvedPair=${PAIR_ADDRESS}, url=${URL}`);
  return {
    onReady: (callback) => {
      setTimeout(() => callback(data_vars));
    },

    searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
      onResultReadyCallback([]);
    },

    resolveSymbol: async (
      symbolName,
      onSymbolResolvedCallback,
    ) => {
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
        pairAddress: data.poolAddress,
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
        const pairAddress =
        PAIR_ADDRESS ||
        symbolInfo?.pairAddress ||
        symbolInfo?.address ||
        data.poolAddress;
        const intervalParam = mapResolutionToSeconds(resolution);

        // TradingView Charting Library passes from/to in milliseconds
        const fromSec = periodParams.from
          ? Math.floor(Number(periodParams.from)) - 2 * 24 * 60 * 60
          : 0;
        const toSec = periodParams.to ? Math.floor(Number(periodParams.to)) : 0;
        const query = `{
          candles(
            first: 1000,
            orderBy: BUCKET_START_ASC,
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

        const doFetch = async (q) => {
          console.log(`[getBars] chainId=${chainId}, using pairId=${pairAddress}`);
          const res = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, query: q }),
          });
          const json = await res.json();
          return json?.data?.candles?.nodes ?? [];
        };

        // First try with time filter
        let candles = await doFetch(query);
        // Fallback: if no data returned (common for 1m small windows), refetch without time filter
        if ((!candles || candles.length === 0) && fromSec && toSec) {
          const fallbackQuery = `{
            candles(
              first: 1000,
              orderBy: BUCKET_START_ASC,
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

        // Drop empty candles (no traded volume)
        const nonEmptyBars = allBars.filter(
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
      subscriberUID,
    ) => {
      const pairAddress =
        PAIR_ADDRESS ||
        symbolInfo?.pairAddress ||
        symbolInfo?.address ||
        data.poolAddress;
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
