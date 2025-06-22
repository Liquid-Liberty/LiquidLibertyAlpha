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


const TradingViewChart = ({ symbol }) => {
    const containerRef = useRef(null);
    const scriptLoadedRef = useRef(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Create a stable, unique ID by replacing invalid characters. This fixes the querySelector bug.
    const chartContainerId = `tradingview_${symbol.replace(/[:/]/g, '_')}`;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const createWidget = () => {
            if (typeof window.TradingView !== 'undefined') {
                container.innerHTML = ''; // Clear previous widget to prevent duplicates
                new window.TradingView.widget({
                    width: "100%",
                    height: "100%",
                    symbol: symbol,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    toolbar_bg: "#f1f3f6",
                    enable_publishing: false,
                    hide_side_toolbar: false,
                    allow_symbol_change: true,
                    details: true,
                    hotlist: true,
                    calendar: true,
                    container_id: chartContainerId,
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
            <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-2 right-2 z-10 p-2 bg-stone-700/50 text-white rounded-full hover:bg-stone-600 transition"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
            </button>
        </div>
    );
};

export default TradingViewChart;
