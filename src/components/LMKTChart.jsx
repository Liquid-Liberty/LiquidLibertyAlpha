import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { fetchLMKTData, fetchLMKTCurrentStats } from '../utils/subgraph';
import { LMKT_CONFIG } from '../config/lmkt-config';

const LMKTChart = ({ pairAddress = "0x0000000000000000000000000000000000000000" }) => {
    const [chartData, setChartData] = useState([]);
    const [currentStats, setCurrentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interval, setInterval] = useState(LMKT_CONFIG.DEFAULT_INTERVAL);

    // Mock data structure - replace with actual subgraph query
    const mockData = [
        { timestamp: '2024-01-01', price: 1.25, volume: 1000000, marketCap: 12500000 },
        { timestamp: '2024-01-02', price: 1.30, volume: 1200000, marketCap: 13000000 },
        { timestamp: '2024-01-03', price: 1.28, volume: 1100000, marketCap: 12800000 },
        { timestamp: '2024-01-04', price: 1.35, volume: 1400000, marketCap: 13500000 },
        { timestamp: '2024-01-05', price: 1.32, volume: 1300000, marketCap: 13200000 },
        { timestamp: '2024-01-06', price: 1.40, volume: 1500000, marketCap: 14000000 },
        { timestamp: '2024-01-07', price: 1.38, volume: 1450000, marketCap: 13800000 },
    ];

    useEffect(() => {
        if (pairAddress !== "0x0000000000000000000000000000000000000000") {
            fetchSubgraphData();
            fetchCurrentStats();
        }
    }, [pairAddress, interval]);

    const fetchCurrentStats = async () => {
        try {
            const stats = await fetchLMKTCurrentStats(pairAddress);
            if (stats) {
                setCurrentStats(stats);
            }
        } catch (error) {
            console.warn('Failed to fetch current stats:', error);
        }
    };

    const fetchSubgraphData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Try to fetch real data from subgraph
            try {
                console.log("aria data fetch = ", pairAddress, interval)
                const data = await fetchLMKTData(pairAddress, interval, 100); // Fetch last 100 candles
                console.log("aria data = ", data)
                if (data && data.length > 0) {
                    setChartData(data);
                    setLoading(false);
                    return;
                }
            } catch (subgraphError) {
                console.warn('Subgraph fetch failed, using mock data:', subgraphError);
            }
            
            // Fallback to mock data if subgraph is not available
            setChartData(mockData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-gray-600">Loading LMKT data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[500px] rounded-lg bg-red-50 flex items-center justify-center">
                <div className="text-red-600">
                    <div className="font-bold mb-2">Error loading data</div>
                    <div className="text-sm">{error}</div>
                    <button 
                        onClick={fetchSubgraphData}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-zinc-800">Liberty Market Token (LMKT)</h4>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {LMKT_CONFIG.INTERVALS.map((int) => (
                            <button
                                key={int}
                                onClick={() => setInterval(int)}
                                className={`px-3 py-1 text-xs rounded-md transition ${
                                    interval === int
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                {int}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => {
                            fetchSubgraphData();
                            fetchCurrentStats();
                        }}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition"
                    >
                        Refresh
                    </button>
                </div>
            </div>
            
            <div className="h-[500px] rounded-lg overflow-hidden relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="timestamp" 
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value) => `$${value.toFixed(4)}`}
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => [
                                `$${value.toFixed(4)}`,
                                name === 'close' ? 'Close' : name === 'high' ? 'High' : name === 'low' ? 'Low' : 'Open'
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="close"
                            stroke={LMKT_CONFIG.COLORS.close}
                            strokeWidth={2}
                            dot={{ fill: LMKT_CONFIG.COLORS.close, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, stroke: LMKT_CONFIG.COLORS.close, strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="high"
                            stroke={LMKT_CONFIG.COLORS.high}
                            strokeWidth={1}
                            dot={{ fill: LMKT_CONFIG.COLORS.high, strokeWidth: 1, r: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="low"
                            stroke={LMKT_CONFIG.COLORS.low}
                            strokeWidth={1}
                            dot={{ fill: LMKT_CONFIG.COLORS.low, strokeWidth: 1, r: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Close</div>
                    <div className="font-bold text-lg" style={{ color: LMKT_CONFIG.COLORS.close }}>
                        ${currentStats?.price?.toFixed(4) || chartData[chartData.length - 1]?.close?.toFixed(4) || '0.0000'}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">High</div>
                    <div className="font-bold text-lg" style={{ color: LMKT_CONFIG.COLORS.high }}>
                        ${currentStats?.high?.toFixed(4) || chartData[chartData.length - 1]?.high?.toFixed(4) || '0.0000'}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Low</div>
                    <div className="font-bold text-lg" style={{ color: LMKT_CONFIG.COLORS.low }}>
                        ${currentStats?.low?.toFixed(4) || chartData[chartData.length - 1]?.low?.toFixed(4) || '0.0000'}
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Volume</div>
                    <div className="font-bold text-lg" style={{ color: LMKT_CONFIG.COLORS.volume }}>
                        {currentStats?.volume24h?.toLocaleString() || chartData[chartData.length - 1]?.volume?.toLocaleString() || '0'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LMKTChart;
