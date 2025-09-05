import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { LMKT_CONFIG } from "../config/lmkt-config";
import { SUBQUERY_CONFIG } from "../config/subgraph-config";

const LMKTTvChart = ({
  pairAddress = LMKT_CONFIG.PAIR_ADDRESS,
  defaultInterval = LMKT_CONFIG.DEFAULT_INTERVAL,
  intervals = LMKT_CONFIG.INTERVALS,
  height = 500,
  refreshKey = 0,
}) => {
  const priceContainerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const priceChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [interval, setInterval] = useState(defaultInterval);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const formatIntervalLabel = (value) => {
    const seconds = parseInt(value, 10);
    if (seconds % 86400 === 0) return `${seconds / 86400}d`;
    if (seconds % 3600 === 0) return `${seconds / 3600}h`;
    if (seconds % 60 === 0) return `${seconds / 60}m`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (!priceContainerRef.current || !volumeContainerRef.current) return;

    const priceHeight = Math.round(height * 0.7);
    const volumeHeight = height - priceHeight;

    // --- Price chart ---
    const priceChart = createChart(priceContainerRef.current, {
      width: priceContainerRef.current.clientWidth,
      height: priceHeight,
      layout: {
        background: { type: "Solid", color: "#0f0f0f" },
        textColor: "#d1d5db",
      },
      rightPriceScale: {
        borderColor: "#1A1A1A",
        visible: true,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "#1A1A1A",
        visible: true,
        timeVisible: false,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          return new Date(time * 1000).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      grid: {
        vertLines: { color: "#1A1A1A" },
        horzLines: { color: "#1A1A1A" },
      },
      crosshair: { mode: 1 },
    });

    // ✅ Force more labels on Y-axis
    priceChart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.05 },
      mode: 0, // normal (not % or log)
      autoScale: true,
      alignLabels: true,
      borderVisible: true,
    });

    // ✅ Force more labels on X-axis
    priceChart.timeScale().applyOptions({
      minBarSpacing: 1, // lower spacing = more labels
      fixLeftEdge: false,
      fixRightEdge: false,
      tickMarkSpacing: 30, // tighter spacing = more ticks
    });

    priceChart.applyOptions({
      layout: {
        fontSize: 14, // ⬅️ make axis numbers larger
        fontFamily: "Inter, sans-serif",
      },
    });

    // --- Volume chart ---
    const volumeChart = createChart(volumeContainerRef.current, {
      width: volumeContainerRef.current.clientWidth,
      height: volumeHeight,
      layout: {
        background: { type: "Solid", color: "#0f0f0f" },
        textColor: "#d1d5db",
      },
      rightPriceScale: {
        borderColor: "#1A1A1A",
        visible: true,
        scaleMargins: { top: 0.05, bottom: 0 },
      },
      timeScale: {
        borderColor: "#1A1A1A",
        visible: true,
        timeVisible: true,
      },
      grid: {
        vertLines: { color: "#1A1A1A" },
        horzLines: { color: "#1A1A1A" },
      },
    });

    volumeChart.applyOptions({
      layout: {
        fontSize: 14, // ⬅️ larger tick labels
        fontFamily: "Inter, sans-serif",
      },
    });

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: "#089981", // green
      borderUpColor: "#089981",
      wickUpColor: "#089981",
      downColor: "#d4404a", // red
      borderDownColor: "#d4404a",
      wickDownColor: "#d4404a",
      priceFormat: { type: "price", precision: 4, minMove: 0.00001 },
    });

    const volumeSeries = volumeChart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "right",
      scaleMargins: { top: 0.1, bottom: 0 },
    });

    priceChartRef.current = priceChart;
    volumeChartRef.current = volumeChart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // --- Resize ---
    const handleResize = () => {
      if (priceContainerRef.current && volumeContainerRef.current) {
        const containerWidth = priceContainerRef.current.clientWidth;
        priceChart.applyOptions({ width: containerWidth });
        volumeChart.applyOptions({ width: containerWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    if (pairAddress) fetchCandles();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (priceChart) priceChart.remove();
      if (volumeChart) volumeChart.remove();
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [pairAddress, height]);

  useEffect(() => {
    if (!pairAddress || !priceChartRef.current || !volumeChartRef.current)
      return;
    fetchCandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairAddress, interval]);

  useEffect(() => {
    if (!pairAddress) return;
    fetchCandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchCandles = async () => {
    if (
      isFetchingRef.current ||
      !pairAddress ||
      !candleSeriesRef.current ||
      !volumeSeriesRef.current
    )
      return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const query = `{
        candles(
          first: 100,
          orderBy: bucketStart,
          orderDirection: asc,
          where: {
            pair: "${pairAddress.toLowerCase()}",
            interval: "${interval}"
          }
        ) {
          bucketStart
          open
          high
          low
          close
          volumeToken0
        }
      }`;

      const response = await fetch(SUBQUERY_CONFIG.URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();

      if (data?.candles && data.candles.length > 0) {
        const candleData = data.candles.map((candle) => ({
          time: parseInt(candle.bucketStart), // keep as seconds, DO NOT * 1000
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
        })).filter((c) => c.high !== c.low);
        const volumeData = data.candles.map((candle) => ({
          time: parseInt(candle.bucketStart),
          value: parseFloat(candle.volumeToken0),
          color:
            parseFloat(candle.close) >= parseFloat(candle.open)
              ? "#26a69a"
              : "#ef5350",
        }));

        candleSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        priceChartRef.current.timeScale().fitContent();
        volumeChartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error fetching candles:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  return (
    <div className="bg-stone-900 p-4 rounded-lg shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-gray-100">LMKT Price Chart</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-800 rounded-lg p-1">
            {intervals.map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  interval === int
                    ? "bg-teal-600 text-white shadow"
                    : "text-gray-300 hover:bg-stone-700"
                }`}
              >
                {formatIntervalLabel(int)}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchCandles()}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "🔄" : "↻"}
          </button>
        </div>
      </div>
      <div style={{ height }} className="w-full rounded-lg overflow-hidden">
        <div ref={priceContainerRef} style={{ height: "70%", width: "100%" }} />
        <div
          ref={volumeContainerRef}
          style={{ height: "30%", width: "100%" }}
        />
      </div>
    </div>
  );
};

export default LMKTTvChart;
