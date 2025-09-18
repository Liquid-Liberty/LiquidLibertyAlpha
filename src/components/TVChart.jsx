import React, { useEffect, useRef, useState } from 'react';

// Icons for the fullscreen button
const EnterFullscreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06L13.19 4.5H9.75a.75.75 0 010-1.5h4.5A.75.75 0 0115 3.75zM9 15.75a.75.75 0 01.75.75v3.44l3.97-3.97a.75.75 0 111.06 1.06L10.81 21H14.25a.75.75 0 010 1.5H9.75a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const ExitFullscreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.25 9a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H6.56l3.97 3.97a.75.75 0 11-1.06 1.06L5.5 10.81V14.25a.75.75 0 01-1.5 0V9.75A.75.75 0 015.25 9zM18.75 15a.75.75 0 01.75.75v3.44l-3.97-3.97a.75.75 0 10-1.06 1.06l3.97 3.97H15.75a.75.75 0 010 1.5h4.5a.75.75 0 01.75-.75v-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

const defaultProps = {
    symbol: 'LiquidLiberty',
    libraryPath: '/tradingview/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    fullscreen: false,
    autosize: false,
};


const TradingViewChart = ({ symbol }) => {
    const containerRef = useRef(null);
    const scriptLoadedRef = useRef(false);
    const [isFullscreen] = useState(false);

    // Create a stable, unique ID by replacing invalid characters. This fixes the querySelector bug.
    const chartContainerId = `tradingview_${symbol.replace(/[:/]/g, '_')}`;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const createWidget = () => {
            if (typeof window.TradingView !== 'undefined') {
                container.innerHTML = ''; // Clear previous widget to prevent duplicates
                new window.TradingView.widget({
                    enabled_features: ["custom_resolutions"],
                    overrides: {
                        'mainSeriesProperties.statusViewStyle.showExchange': false,
                        'mainSeriesProperties.priceScale.autoScale': true,
                        volumePaneSize: 'small',
                        keep_object_tree_widget_in_right_toolbar: true,
                    },
                    studies_overrides: {
                        'volume.volume.ma.visible': false,
                    },
                    loading_screen: {
                        backgroundColor: '#000000',
                    },
                    width: "100%",
                    height: "100%",
                    symbol: symbol,
                    interval: "D",
                    timezone: "America/New_York",
                    theme: "dark",
                    style: "3",
                    locale: "en",
                    toolbar_bg: "#f1f3f6",
                    enable_publishing: false,
                    hide_side_toolbar: false,
                    allow_symbol_change: false,
                    details: false,
                    hotlist: false,
                    calendar: false,
                    charts_storage_url: defaultProps.chartsStorageUrl,
                    charts_storage_api_version: '1.1',
                    fullscreen: defaultProps.fullscreen,
                    autosize: defaultProps.autosize,
                    container_id: chartContainerId,
                    custom_css_url: '/tradingview/styles/custom.css',
                    disabled_features: ['header_symbol_search', 'header_compare', 'display_market_status', 'header_saveload', 'timeframes_toolbar', 'chart_template_storage'],
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
                            // This function needs to be defined or imported elsewhere in your project
                            // For example: const formatNumber = (price) => price.toFixed(6);
                            return { format: (price) => formatNumber(price) };
                        },
                    },
                });
            }
        };

        if (!scriptLoadedRef.current) {
            const script = document.createElement("script");
            script.src = "https://s3.tradingview.com/tv.js";
            script.type = "text/javascript";
            script.async = true;
            script.onload = () => {
                scriptLoadedRef.current = true;
                createWidget();
            };
            document.body.appendChild(script);
        } else {
            createWidget();
        }

    }, [symbol, isFullscreen, chartContainerId]);

    const fullscreenClasses = isFullscreen
        ? "fixed inset-0 z-50 bg-stone-900 p-4"
        : "relative w-full h-full";

    return (
        <div className={fullscreenClasses}>
            <div id={chartContainerId} ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default TradingViewChart;