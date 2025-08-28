import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { LMKT_CONFIG } from '../config/lmkt-config';
import { SUBGRAPH_CONFIG } from '../config/subgraph-config';

const LMKTTvChart = ({
  pairAddress,
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

    const priceChart = createChart(priceContainerRef.current, {
      width: priceContainerRef.current.clientWidth,
      height: priceHeight,
      layout: { background: { type: 'Solid', color: '#ffffff' }, textColor: '#374151' },
      rightPriceScale: { borderColor: '#e5e7eb', visible: true },
      leftPriceScale: { visible: false },
      timeScale: { borderColor: '#e5e7eb', visible: false },
      grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
      crosshair: { mode: 1 },
    });

    const volumeChart = createChart(volumeContainerRef.current, {
      width: volumeContainerRef.current.clientWidth,
      height: volumeHeight,
      layout: { background: { type: 'Solid', color: '#ffffff' }, textColor: '#374151' },
      rightPriceScale: { borderColor: '#e5e7eb', visible: true },
      leftPriceScale: { visible: false },
      timeScale: { borderColor: '#e5e7eb', visible: true },
      grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
    });

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: '#10b981',
      borderUpColor: '#10b981',
      wickUpColor: '#10b981',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      wickDownColor: '#ef5350',
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    });

    const volumeSeries = volumeChart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'right',
      scaleMargins: { top: 0.1, bottom: 0 },
    });

    priceChartRef.current = priceChart;
    volumeChartRef.current = volumeChart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Hide TradingView brand links in both panes
    const hideLogo = (el) => {
      if (!el) return () => {};
      const hide = () => el.querySelectorAll('a').forEach((a) => (a.style.display = 'none'));
      hide();
      const observer = new MutationObserver(hide);
      observer.observe(el, { childList: true, subtree: true });
      return () => observer.disconnect();
    };
    const disconnectPriceLogo = hideLogo(priceContainerRef.current);
    const disconnectVolumeLogo = hideLogo(volumeContainerRef.current);

    // Sync visible range between charts
    let isSyncing = false;
    const syncFromPrice = () => {
      if (isSyncing) return;
      isSyncing = true;
      const range = priceChart.timeScale().getVisibleLogicalRange();
      if (range) volumeChart.timeScale().setVisibleLogicalRange(range);
      isSyncing = false;
    };
    const syncFromVolume = () => {
      if (isSyncing) return;
      isSyncing = true;
      const range = volumeChart.timeScale().getVisibleLogicalRange();
      if (range) priceChart.timeScale().setVisibleLogicalRange(range);
      isSyncing = false;
    };

    priceChart.timeScale().subscribeVisibleLogicalRangeChange(syncFromPrice);
    volumeChart.timeScale().subscribeVisibleLogicalRangeChange(syncFromVolume);

    // Handle window resize
    const handleResize = () => {
      if (priceContainerRef.current && volumeContainerRef.current) {
        const containerWidth = priceContainerRef.current.clientWidth;
        priceChart.applyOptions({ width: containerWidth });
        volumeChart.applyOptions({ width: containerWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial data fetch
    if (pairAddress) {
      fetchCandles();
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      disconnectPriceLogo();
      disconnectVolumeLogo();
      if (priceChart) {
        priceChart.remove();
        priceChartRef.current = null;
      }
      if (volumeChart) {
        volumeChart.remove();
        volumeChartRef.current = null;
      }
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [pairAddress, height]); // Only recreate charts when pairAddress or height changes

  useEffect(() => {
    if (!pairAddress || !priceChartRef.current || !volumeChartRef.current) return;
    fetchCandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairAddress, interval]);

  // Refresh when external signal changes (e.g., buy/sell success)
  useEffect(() => {
    if (!pairAddress) return;
    fetchCandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Periodic auto-refresh aligned to candle boundary
  useEffect(() => {
    if (!pairAddress) return;
    const seconds = parseInt(interval, 10) || 60;
    const now = Math.floor(Date.now() / 1000);
    const secsToBoundary = seconds - (now % seconds);
    let intervalId;
    const timeoutId = setTimeout(() => {
      fetchCandles();
      intervalId = setInterval(() => {
        fetchCandles();
      }, seconds * 1000);
    }, secsToBoundary * 1000);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairAddress, interval]);

  // Fetch candles data
  const fetchCandles = async () => {
    if (isFetchingRef.current || !pairAddress || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
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

      const response = await fetch(SUBGRAPH_CONFIG.URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();

      if (data?.candles && data.candles.length > 0) {
        const candleData = data.candles.map((candle) => ({
          time: parseInt(candle.bucketStart),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
        }));

        const volumeData = data.candles.map((candle) => ({
          time: parseInt(candle.bucketStart),
          value: parseFloat(candle.volumeToken0),
          color: parseFloat(candle.close) >= parseFloat(candle.open) ? '#26a69a' : '#ef5350',
        }));

        // Only update if charts are still valid
        if (candleSeriesRef.current && volumeSeriesRef.current) {
          candleSeriesRef.current.setData(candleData);
          volumeSeriesRef.current.setData(volumeData);

          // Fit content to show all data
          if (priceChartRef.current && volumeChartRef.current) {
            priceChartRef.current.timeScale().fitContent();
            volumeChartRef.current.timeScale().fitContent();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching candles:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Handle interval change
  const handleIntervalChange = (newInterval) => {
    if (newInterval !== interval) {
      setInterval(newInterval);
      // Clear any existing data to prevent display issues
      if (candleSeriesRef.current && volumeSeriesRef.current) {
        candleSeriesRef.current.setData([]);
        volumeSeriesRef.current.setData([]);
      }
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    if (candleSeriesRef.current && volumeSeriesRef.current) {
      fetchCandles();
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-zinc-800">LMKT Price Chart</h3>
        <div className="flex items-center gap-2">
          {/* Interval Selection */}
          <div className="flex bg-stone-100 rounded-lg p-1">
            {intervals.map((int) => (
              <button
                key={int}
                onClick={() => handleIntervalChange(int)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  interval === int
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-zinc-600 hover:bg-stone-200'
                }`}
              >
                {formatIntervalLabel(int)}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ height }} className="w-full rounded-lg overflow-hidden">
        <div ref={priceContainerRef} style={{ height: '70%', width: '99.8%' }} />
        <div ref={volumeContainerRef} style={{ height: '30%', width: '100%' }} />
      </div>
    </div>
  );
};

export default LMKTTvChart;
