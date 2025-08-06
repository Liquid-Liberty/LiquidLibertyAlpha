import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import TradingViewChart from '../components/TradingViewChart';
import MyListings from '../components/MyListings';

const WHITELISTED_TOKENS = [
    { id: 'lmkt', name: 'Liberty Market Token', symbol: 'LMKT', contractAddress: '0x1111111111111111111111111111111111111111', tradingViewSymbol: 'UNISWAP:WETHUSDC' }, // Placeholder symbol
    { id: 'lbrty', name: 'LBRTY', symbol: 'LBRTY', contractAddress: '0xB261Fa283aBf9CcE0b493B50b57cb654A490f339', tradingViewSymbol: 'COINBASE:SOLUSD' }, // Using Solana as a distinct placeholder
    { id: 'wbtc', name: 'Wrapped BTC', symbol: 'WBTC', contractAddress: '0x3333333333333333333333333333333333333333', tradingViewSymbol: 'COINBASE:BTCUSD' },
    { id: 'dai', name: 'DAI', symbol: 'DAI', contractAddress: '0xefD766cCb38EaF1dfd701853BFCe31359239F305', tradingViewSymbol: 'KRAKEN:DAIUSD' },
    { id: 'weth', name: 'WETH', symbol: 'WETH', contractAddress: '0x02DcdD04e3a455B21854B2643D5eE36163390A05', tradingViewSymbol: 'COINBASE:ETHUSD' }
];

const OTHER_CHARTS = [
    { id: 'portfolio', name: 'Portfolio', symbol: 'Portfolio', tradingViewSymbol: 'CRYPTOCAP:TOTAL' }, // Using total crypto market cap as a placeholder
];

const ChartToolbar = ({ token }) => {
    const [copyText, setCopyText] = useState('Copy');
    const handleCopyAddress = () => navigator.clipboard.writeText(token.contractAddress).then(() => { setCopyText('Copied!'); setTimeout(() => setCopyText('Copy'), 2000); });
    const handleImportToken = async () => {
        if (window.ethereum) await window.ethereum.request({ method: 'wallet_watchAsset', params: { type: 'ERC20', options: { address: token.contractAddress, symbol: token.symbol, decimals: 18 } } });
    };
    const blockExplorerUrl = `https://scan.v4.testnet.pulsechain.com/token/${token.contractAddress}`;
    return (
        <div className="flex items-center space-x-2">
            <button onClick={handleImportToken} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition">Import</button>
            <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">Explorer</a>
            <button onClick={handleCopyAddress} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded min-w-[50px]">{copyText}</button>
        </div>
    );
};

const AccordionSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left font-display font-bold text-zinc-800">
                <h2 className="text-2xl">{title}</h2>
                <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="mt-4">{children}</div>}
        </div>
    );
};

const DashboardPage = ({ listings, userAddress }) => {
    const { isConnected } = useAccount();
    const [treasuryTab, setTreasuryTab] = useState('buy');

    if (!isConnected) {
        return <div className="p-8 text-center text-xl">Please connect your wallet to view the dashboard.</div>;
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-zinc-800 mb-8">Dashboard</h1>
                
                <AccordionSection title="My Listings">
                    <MyListings listings={listings} userAddress={userAddress} />
                </AccordionSection>

                <AccordionSection title="Treasury">
                    <div className="w-full max-w-lg mx-auto">
                        <div className="flex justify-center bg-stone-200 rounded-lg p-1 mb-6">
                            <button onClick={() => setTreasuryTab('buy')} className={`px-6 py-2 rounded-md font-bold w-1/2 ${treasuryTab === 'buy' ? 'bg-teal-800 text-white shadow' : 'text-zinc-700'}`}>Buy LMKT</button>
                            <button onClick={() => setTreasuryTab('sell')} className={`px-6 py-2 rounded-md font-bold w-1/2 ${treasuryTab === 'sell' ? 'bg-teal-800 text-white shadow' : 'text-zinc-700'}`}>Sell LMKT</button>
                        </div>

                        {treasuryTab === 'buy' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Spend</label>
                                    <div className="flex">
                                        <input type="number" placeholder="0.0" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                        <select className="px-4 py-2 bg-stone-100 border-t border-b border-r border-zinc-300 rounded-r-md">
                                            {WHITELISTED_TOKENS.filter(t => t.id !== 'lmkt' && t.id !== 'lbrty').map(token => (
                                                <option key={token.id} value={token.symbol}>{token.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Receive (Estimated)</label>
                                    <div className="flex">
                                        <input type="number" placeholder="0.0" readOnly className="w-full px-4 py-2 bg-stone-100 border border-zinc-300 rounded-l-md" />
                                        <span className="px-4 py-2 bg-stone-200 border-t border-b border-r border-zinc-300 rounded-r-md font-bold text-zinc-600">LMKT</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 bg-teal-800 text-white py-3 rounded-md hover:bg-teal-900 transition font-bold text-lg">Buy LMKT</button>
                            </div>
                        )}

                        {treasuryTab === 'sell' && (
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Spend (Sell)</label>
                                    <div className="flex">
                                        <input type="number" placeholder="0.0" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500 transition" />
                                        <span className="px-4 py-2 bg-stone-200 border-t border-b border-r border-zinc-300 rounded-r-md font-bold text-zinc-600">LMKT</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Receive (Estimated)</label>
                                    <div className="flex">
                                        <input type="number" placeholder="0.0" readOnly className="w-full px-4 py-2 bg-stone-100 border border-zinc-300 rounded-l-md" />
                                        <select className="px-4 py-2 bg-stone-100 border-t border-b border-r border-zinc-300 rounded-r-md">
                                            {WHITELISTED_TOKENS.filter(t => t.id !== 'lmkt' && t.id !== 'lbrty').map(token => (
                                                <option key={token.id} value={token.symbol}>{token.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button className="w-full mt-4 bg-red-700 text-white py-3 rounded-md hover:bg-red-800 transition font-bold text-lg">Sell LMKT</button>
                            </div>
                        )}
                    </div>
                </AccordionSection>

                <AccordionSection title="Portfolio & System Health">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {OTHER_CHARTS.map(chart => (
                             <div key={chart.id}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-bold text-zinc-800">{chart.name}</h4>
                                </div>
                                <div className="h-[500px] rounded-lg overflow-hidden relative">
                                    <TradingViewChart symbol={chart.tradingViewSymbol} />
                                </div>
                            </div>
                        ))}
                        {WHITELISTED_TOKENS.map(token => (
                            <div key={token.id}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-bold text-zinc-800">{token.name}</h4>
                                    <ChartToolbar token={token} />
                                </div>
                                <div className="h-[500px] rounded-lg overflow-hidden relative">
                                    <TradingViewChart symbol={token.tradingViewSymbol} />
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionSection>
            </div>
        </div>
    );
};

export default DashboardPage;