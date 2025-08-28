import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GetDatafeedProvider } from '../helpers/chartingDatafeed.js';

// Mock websocket client for demo purposes
class MockWebsocketClient {
  constructor() {}
  close() {}
}

const defaultProps = {
  symbol: 'LiquidLiberty',
  libraryPath: '/tradingview/charting_library/',
  chartsStorageUrl: 'https://saveload.tradingview.com',
  chartsStorageApiVersion: '1.1',
  fullscreen: false,
  autosize: false,
};

const formatNumber = (price) => {
  if (price < 0.01) return price.toFixed(4);
  if (price < 1) return price.toFixed(3);
  if (price < 10) return price.toFixed(2);
  if (price < 100) return price.toFixed(2);
  return price.toFixed(2);
};

export const TVChart = ({ 
  widget, 
  setWidget, 
  data, 
  interval = '5', 
  onLoaded = undefined 
}) => {
  const chartContainerRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [lastChartValues, setLastChartValues] = useState({ time: null, res: null });
  const [lastClick, setLastClick] = useState(null);
  const [tvReady, setTvReady] = useState(false);
  
  // Mock websocket for demo
  const ws_pool = new MockWebsocketClient();

  const handleClick = () => {
    setLastClick(Date.now());
  };

  const handleResize = () => {
    if (chartContainerRef.current) {
      chartContainerRef.current.style.width = '100%';
    }
  };

  // Wait for TradingView script to be available
  useEffect(() => {
    if (window.TradingView?.widget) {
      setTvReady(true);
      return;
    }
    const checkInterval = window.setInterval(() => {
      if (window.TradingView?.widget) {
        setTvReady(true);
        window.clearInterval(checkInterval);
      }
    }, 100);
    return () => window.clearInterval(checkInterval);
  }, []);

  // Create widget, this code is only used once
  useEffect(() => {
    if (chartContainerRef && chartContainerRef.current && !widget && ws_pool && tvReady) {
      const widgetOptions = {
        enabled_features: ["custom_resolutions"],
        overrides: {
          'mainSeriesProperties.statusViewStyle.showExchange': false,
          volumePaneSize: 'small',
          keep_object_tree_widget_in_right_toolbar: true,
        },
        studies_overrides: {
          'volume.volume.ma.visible': false,
        },
        loading_screen: {
          backgroundColor: '#000000',
        },
        theme: 'dark',
        symbol: defaultProps.symbol,
        datafeed: GetDatafeedProvider(data, ws_pool),
        container: chartContainerRef.current,
        library_path: defaultProps.libraryPath,
        interval: (interval || '5'),
        locale: 'en',
        custom_css_url: '/tradingview/styles/custom.css',
        disabled_features: ['header_symbol_search', 'header_compare', 'display_market_status', 'header_saveload', 'timeframes_toolbar','chart_template_storage','header_fullscreen_button','header_settings'],
        charts_storage_url: defaultProps.chartsStorageUrl,
        charts_storage_api_version: '1.1',
        fullscreen: defaultProps.fullscreen,
        autosize: defaultProps.autosize,
        custom_formatters: {
          timeFormatter: {
            format: (date) => {
              const _format_str = '%h:%m';
              return _format_str
                .replace('%h', date.getHours().toString().padStart(2, '0'))
                .replace('%m', date.getMinutes().toString().padStart(2, '0'))
                .replace('%s', date.getSeconds().toString().padStart(2, '0'));
            },
            formatLocal: (date) => {
              const _format_str = '%h:%m';
              return _format_str
                .replace('%h', date.getHours().toString().padStart(2, '0'))
                .replace('%m', date.getMinutes().toString().padStart(2, '0'))
                .replace('%s', date.getSeconds().toString().padStart(2, '0'));
            },
          },
          dateFormatter: {
            format: (date) => {
              return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
            },
            formatLocal: (date) => {
              return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
            },
          },
          priceFormatterFactory: () => {
            return { format: (price) => formatNumber(price) };
          },
        },
      };

      if (window.TradingView?.widget) {
        setWidget(new window.TradingView.widget(widgetOptions));
      }
    }
  }, [widget, chartContainerRef, data, interval, ws_pool, setWidget, tvReady]);

  useEffect(() => {
    if (widget) {
      widget.onChartReady(() => {
        widget.applyOverrides({
          'mainSeriesProperties.visible': true,
          'mainSeriesProperties.style': 1,
          'paneProperties.backgroundType': 'solid',
          'paneProperties.background': '#0f0f0f', // Chart background color
          'paneProperties.vertGridProperties.color': '#1A1A1A', // Vertical grid lines color
          'paneProperties.horzGridProperties.color': '#1A1A1A', // Horizontal grid lines color
        });

        const savedChartState = localStorage.getItem('tradingViewDrawingState');
        if (savedChartState) {
          try {
            widget.load(JSON.parse(savedChartState));
          } catch (e) {
            console.error('Failed to load saved chart state:', e);
          }
        }

        widget.chart().getSeries().setChartStyleProperties(1, {
          upColor: '#089981',
          downColor: '#d4404a',
          borderUpColor: '#089981',
          borderDownColor: '#d4404a'
        });

        widget.subscribe('drawing_event', () => {
          widget.save((state) => {
            localStorage.setItem('tradingViewDrawingState', JSON.stringify(state));
          });
        });
        setChartReady(true);
      });
      console.log(widget);
    }
  }, [widget]);

  useEffect(() => {
    if (widget && chartReady) {
      if (onLoaded) onLoaded();
      widget.subscribe('mouse_up', handleClick);
    }
  }, [widget, chartReady, onLoaded]);

  return (
    <AnimatePresence>
      <motion.div
        key='chart'
        ref={chartContainerRef}
        className={`min-h-[500px] h-full w-full overflow-hidden rounded-md object-cover ${
          chartReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </AnimatePresence>
  );
};
