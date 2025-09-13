import React, { useEffect, useRef } from "react";
import { GetDatafeedProvider } from "../helpers/chartingDatafeed.js";
import { useChainId } from "wagmi";

class MockWebsocketClient {
  close() {}
}

const LIB_PATH = "/tradingview/charting_library/";

// ensure hidden "parking lot" div exists in DOM
function ensureParkingLot() {
  let lot = document.getElementById("tv-parking-lot");
  if (!lot) {
    lot = document.createElement("div");
    lot.id = "tv-parking-lot";
    Object.assign(lot.style, {
      position: "fixed",
      left: "-99999px",
      top: "-99999px",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      pointerEvents: "none",
    });
    document.body.appendChild(lot);
  }
  return lot;
}

export const TVChart = ({ setWidget, data, interval = "5", onLoaded }) => {
  const containerRef = useRef(null);
  const chainId = useChainId();

  useEffect(() => {
    const lot = ensureParkingLot();

    // If widget exists, just move its container into place
    const attachExisting = () => {
      if (window.__tvContainer && containerRef.current) {
        containerRef.current.appendChild(window.__tvContainer);
        requestAnimationFrame(() => window.__tvWidget?.resize?.());
        return true;
      }
      return false;
    };

    // Init if needed
    const initWidget = () => {
      if (attachExisting()) return;

      if (!window.TradingView?.widget) {
        const t = setInterval(() => {
          if (window.TradingView?.widget) {
            clearInterval(t);
            initWidget();
          }
        }, 50);
        return;
      }

      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.height = "100%";
      containerRef.current.appendChild(container);
      window.__tvContainer = container;

      const df = GetDatafeedProvider(data, chainId);

      const tv = new window.TradingView.widget({
        symbol: "CUSTOM:LMKTUSD",
        datafeed: df,
        container,
        library_path: LIB_PATH,
        interval,
        locale: "en",
        theme: "dark",
        disabled_features: [
          "header_symbol_search",
          "header_compare",
          "display_market_status",
          "header_saveload",
          "timeframes_toolbar",
          "chart_template_storage",
          "header_fullscreen_button",
          "header_settings",
        ],
      });

      tv.onChartReady(() => {
        try {
          tv.applyOverrides({
            "paneProperties.background": "#0f0f0f",
            "paneProperties.vertGridProperties.color": "#1A1A1A",
            "paneProperties.horzGridProperties.color": "#1A1A1A",
            "mainSeriesProperties.priceScale.precision": 6,
            "mainSeriesProperties.priceScale.minTick": 0.000001,
          });
        } catch (_) {'error'}
        window.__tvWidget = tv;
        setWidget?.(tv);
        onLoaded?.();
      });
    };

    initWidget();

    // When unmounting (routing away), park the container instead of destroying it
    return () => {
      if (window.__tvContainer && lot && window.__tvContainer.parentNode !== lot) {
        lot.appendChild(window.__tvContainer);
      }
    };
  }, [data, interval, setWidget, onLoaded]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] overflow-hidden rounded-md"
    />
  );
};
