import React, { useState, useEffect } from 'react';
import LMKTTvChart from '../components/LMKTTvChart';
import MyListings from '../components/MyListings';
import { treasuryConfig, lmktConfig, mockDaiConfig, mockWbtcConfig, mockWethConfig } from '../contract-config';
import { LMKT_CONFIG } from '../config/lmkt-config';
import GenericERC20ABI from '../config/GenericERC20.json';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'ethers';
import { useListings } from '../context/ListingsContext';
import ListingsDebug from '../components/ListingsDebug';
import TradingViewChart from '../components/TradingViewChart';
import { TVChart } from '../components/TVChart';

// Only LMKT token is needed for the chart
const LMKT_TOKEN = {
    id: 'lmkt',
    name: 'Liberty Market Token',
    symbol: 'LMKT',
    contractAddress: lmktConfig.address
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
    const { isConnected, address } = useAccount();
    const { listings: blockchainListings, escrows, getUserListings, getUserEscrows, loading: listingsLoading, error: listingsError } = useListings();
    const [selectedToken, setSelectedToken] = useState(LMKT_TOKEN);
    const [amountIn, setAmountIn] = useState(0);
    const [treasuryTab, setTreasuryTab] = useState('buy');
    const { data: approveHash, writeContract: approve } = useWriteContract();
    const { data: buyHash, writeContract: handleBuy } = useWriteContract();
    const { data: sellHash, writeContract: handleSell } = useWriteContract();
    const { isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: isBought, isError: isBuyError, error: buyError } = useWaitForTransactionReceipt({ hash: buyHash });
    const { isSuccess: isSold, isError: isSellError, error: sellError } = useWaitForTransactionReceipt({ hash: sellHash });
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [calculatedLmkt, setCalculatedLmkt] = useState('0');
    const [calculatedCollateral, setCalculatedCollateral] = useState('0');
    const [chartRefreshKey, setChartRefreshKey] = useState(0);
    const [tokenBalances, setTokenBalances] = useState({
        wbtc: '0',
        dai: '0',
        weth: '0',
        lmkt: '0'
    });

    const [interval, setInterval] = useState('5');
    const [symbol, setSymbol] = useState('LMKT/USD');
    const [widget, setWidget] = useState(undefined);

    // Mock pool data for demo
    const mockPoolData = {
        poolAddress: '0x1234567890123456789012345678901234567890',
        baseMint: '0x1234567890123456789012345678901234567890',
        quoteMint: '0x0987654321098765432109876543210987654321',
        price: 0.00012345,
        liquidity: 1000000,
        mcap: 50000,
        baseSymbol: 'LMKT',
        baseName: 'Liberty Market Token',
        quoteSymbol: 'USD',
        quoteName: 'USD',
        dex: 'Uniswap',
        dexImage: '/uniswap.png',
        v24hUSD: 25000,
    };

    const intervals = [
        { value: '1S', label: '1s' },
        { value: '1', label: '1m' },
        { value: '5', label: '5m' },
        { value: '30', label: '30m' },
        { value: '60', label: '1h' },
        { value: '120', label: '2h' },
        { value: '360', label: '6h' },
        { value: '1D', label: '1D' },
        { value: '1W', label: '1W' },
        { value: '1M', label: '1M' },
    ];

    const [tokenAddress, setTokenAddress] = useState(mockWbtcConfig.address); // Default WBTC address for collateral

    // Read token balances
    const { data: wbtcBalance, refetch: refetchWbtcBalance } = useReadContract({
        address: mockWbtcConfig.address,
        abi: GenericERC20ABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    const { data: daiBalance, refetch: refetchDaiBalance } = useReadContract({
        address: mockDaiConfig.address,
        abi: GenericERC20ABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    const { data: wethBalance, refetch: refetchWethBalance } = useReadContract({
        address: mockWethConfig.address,
        abi: GenericERC20ABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    const { data: lmktBalance, refetch: refetchLmktBalance } = useReadContract({
        address: lmktConfig.address,
        abi: GenericERC20ABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    // Update balances when data changes
    useEffect(() => {
        console.log("aria wbtcBalance = ", daiBalance, address, mockDaiConfig.address)
        refetchDaiBalance()
        if (wbtcBalance) setTokenBalances(prev => ({ ...prev, wbtc: formatEther(wbtcBalance) }));
        if (daiBalance) setTokenBalances(prev => ({ ...prev, dai: formatEther(daiBalance) }));
        if (wethBalance) setTokenBalances(prev => ({ ...prev, weth: formatEther(wethBalance) }));
        if (lmktBalance) setTokenBalances(prev => ({ ...prev, lmkt: formatEther(lmktBalance) }));
    }, [wbtcBalance, daiBalance, wethBalance, lmktBalance, address, treasuryTab, tokenAddress, refetchDaiBalance]);

    // Periodic balance refresh
    // useEffect(() => {
    //     if (!address) return;
    //     console.log("aria balance = ", tokenBalances);
    //     const intervalId = setInterval(() => {
    //         refetchWbtcBalance();
    //         refetchDaiBalance();
    //         refetchWethBalance();
    //         refetchLmktBalance();
    //     }, 30000); // Refresh every 30 seconds

    //     return () => clearInterval(intervalId);
    // }, [address, refetchWbtcBalance, refetchDaiBalance, refetchWethBalance, refetchLmktBalance]);

    const { data: lmktAmount, isError, refetch } = useReadContract({
        address: treasuryConfig.address,
        abi: treasuryConfig.abi,
        functionName: 'getLmktAmountForCollateral',
        args: [
            amountIn ? parseEther(amountIn) : 0n,
            tokenAddress
        ],
        query: {
            enabled: amountIn > 0 && tokenAddress !== '0x1111111111111111111111111111111111111111',
        }
    });

    // Contract read for sell calculation (collateral amount for LMKT)
    const { data: collateralAmount, isError: isSellCalcError, refetch: refetchSell } = useReadContract({
        address: treasuryConfig.address,
        abi: treasuryConfig.abi,
        functionName: 'getCollateralAmountForLmkt',
        args: [
            amountIn ? parseEther(amountIn) : 0n,
            tokenAddress // Use LMKT address for sell calculation
        ],
        query: {
            enabled: amountIn > 0 && treasuryTab === 'sell' && tokenAddress !== '0x1111111111111111111111111111111111111111',
        }
    });

    // Refetch when inputs change
    useEffect(() => {
        console.log("aria amountIn = ", amountIn)
        if (amountIn > 0 && tokenAddress !== '0x1111111111111111111111111111111111111111') {
            if (treasuryTab === 'buy') {
                refetch();
                setCalculatedLmkt(lmktAmount ? formatEther(lmktAmount) : '0');
            } else if (treasuryTab === 'sell') {
                refetchSell();
                setCalculatedCollateral(collateralAmount ? formatEther(collateralAmount) : '0');
            }
        } else {
            setCalculatedLmkt('0');
            setCalculatedCollateral('0');
        }
        console.log("aria calculatedLmkt = ", calculatedLmkt)

    }, [amountIn, tokenAddress, treasuryTab, refetch, refetchSell, lmktAmount, collateralAmount, isError, isSellCalcError]);

    // Handle token selection change for collateral tokens
    const handleTokenChange = (tokenSymbol) => {
        let newTokenAddress;
        switch (tokenSymbol) {
            case 'wbtc':
                newTokenAddress = mockWbtcConfig.address;
                break;
            case 'dai':
                newTokenAddress = mockDaiConfig.address;
                break;
            case 'weth':
                newTokenAddress = mockWethConfig.address;
                break;
            default:
                newTokenAddress = mockWbtcConfig.address;
        }
        setTokenAddress(newTokenAddress);

        // Refresh balances when token selection changes
        refetchWbtcBalance();
        refetchDaiBalance();
        refetchWethBalance();
        refetchLmktBalance();
    };

    // Handle amount input change
    const handleAmountChange = (value) => {
        setAmountIn(value);
    };

    // Update calculated LMKT amount when contract call succeeds
    useEffect(() => {
        if (lmktAmount && !isError) {
            setCalculatedLmkt(formatEther(lmktAmount));
        }
    }, [lmktAmount, isError]);

    // Update calculated collateral amount when sell calculation succeeds
    useEffect(() => {
        if (collateralAmount && !isSellCalcError) {
            setCalculatedCollateral(formatEther(collateralAmount));
        }
    }, [collateralAmount, isSellCalcError]);

    // Reset calculations when switching tabs
    useEffect(() => {
        if (treasuryTab === 'buy') {
            setCalculatedCollateral('0');
        } else if (treasuryTab === 'sell') {
            setCalculatedLmkt('0');
        }
    }, [treasuryTab]);


    const handleBuySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Waiting Approval ...');
        approve({
            address: tokenAddress,
            abi: GenericERC20ABI.abi,
            functionName: 'approve',
            args: [treasuryConfig.address, parseEther(amountIn.toString())],
        });
    };

    const handleSellSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage('Waiting Approval ...');
        approve({
            address: lmktConfig.address,
            abi: GenericERC20ABI.abi,
            functionName: 'approve',
            args: [treasuryConfig.address, parseEther(amountIn.toString())],
        });


    };

    useEffect(() => {
        if (isApproved) {
            setStatusMessage('Approved! Please confirm the final transaction...');
            if (treasuryTab === 'buy') {
                handleBuy({
                    address: treasuryConfig.address,
                    abi: treasuryConfig.abi,
                    functionName: 'buyMkt',
                    args: [
                        parseEther(amountIn.toString()),
                        tokenAddress
                    ]
                });
            } else {
                handleSell({
                    address: treasuryConfig.address,
                    abi: treasuryConfig.abi,
                    functionName: 'sellMkt',
                    args: [
                        parseEther(amountIn.toString()),
                        tokenAddress
                    ]
                });
            }
        }
    }, [isApproved]);

    useEffect(() => {
        if (isBought) {
            setIsLoading(false);
            setStatusMessage('');
            setAmountIn(0);
            alert("Purchase successful!");
            setChartRefreshKey((k) => k + 1);
            // Refresh all balances after successful purchase
            refetchWbtcBalance();
            refetchDaiBalance();
            refetchWethBalance();
            refetchLmktBalance();
        }
    }, [isBought, refetchWbtcBalance, refetchDaiBalance, refetchWethBalance, refetchLmktBalance]);

    useEffect(() => {
        if (isSold) {
            setIsLoading(false);
            setStatusMessage('');
            setAmountIn(0);
            alert("Sale successful!");
            setChartRefreshKey((k) => k + 1);
            // Refresh all balances after successful sale
            refetchWbtcBalance();
            refetchDaiBalance();
            refetchWethBalance();
            refetchLmktBalance();
        }
    }, [isSold, refetchWbtcBalance, refetchDaiBalance, refetchWethBalance, refetchLmktBalance]);

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
                                {/* Token Balance Display */}
                                <div className="bg-stone-100 p-4 rounded-lg">
                                    <h3 className="text-sm font-bold text-zinc-700 mb-3">Token Balances</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">WBTC:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.wbtc).toFixed(8)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">DAI:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.dai).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">WETH:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.weth).toFixed(6)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">LMKT:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.lmkt).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Spend</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            value={amountIn}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500 transition"
                                        />
                                        <select
                                            value={tokenAddress === mockWbtcConfig.address ? 'wbtc' : tokenAddress === mockDaiConfig.address ? 'dai' : 'weth'}
                                            onChange={(e) => handleTokenChange(e.target.value)}
                                            className="px-4 py-2 bg-stone-100 border-t border-b border-r border-zinc-300 rounded-r-md"
                                        >
                                            <option value="wbtc">WBTC</option>
                                            <option value="dai">DAI</option>
                                            <option value="weth">WETH</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex">
                                    <input
                                        type="number"
                                        value={calculatedLmkt}
                                        readOnly
                                        className="w-full px-4 py-2 bg-stone-100 border border-zinc-300 rounded-l-md"
                                    />
                                    <span className="px-4 py-2 bg-stone-200 border-t border-b border-r border-zinc-300 rounded-r-md font-bold text-zinc-600">LMKT</span>
                                </div>
                                {/* Show loading and error states */}
                                {isLoading && amountIn > 0 && (
                                    <p className="text-sm text-blue-600 mt-1">🔄 Calculating LMKT amount...</p>
                                )}
                                {isError && amountIn > 0 && (
                                    <p className="text-sm text-red-600 mt-1">❌ Error calculating LMKT amount</p>
                                )}
                                {amountIn > 0 && !isLoading && !isError && calculatedLmkt > 0 && (
                                    <p className="text-sm text-green-600 mt-1">✅ LMKT amount calculated successfully</p>
                                )}

                                <button onClick={handleBuySubmit} disabled={isLoading} className="w-full mt-2 bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 transition font-bold text-lg">
                                    {isLoading ? 'Processing...' : 'Purchase LMKT'}
                                </button>
                                {statusMessage && <p className="text-sm text-zinc-600 mt-2">{statusMessage}</p>}

                            </div>
                        )}

                        {treasuryTab === 'sell' && (
                            <div className="space-y-4">
                                {/* Token Balance Display */}
                                <div className="bg-stone-100 p-4 rounded-lg">
                                    <h3 className="text-sm font-bold text-zinc-700 mb-3">Token Balances</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">WBTC:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.wbtc).toFixed(8)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">DAI:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.dai).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">WETH:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.weth).toFixed(6)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-600">LMKT:</span>
                                            <span className="font-mono font-bold">{parseFloat(tokenBalances.lmkt).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Spend (Sell)</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            value={amountIn}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500 transition"
                                        />
                                        <span className="px-4 py-2 bg-stone-200 border-t border-b border-r border-zinc-300 rounded-r-md font-bold text-zinc-600">LMKT</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-2">You Receive (Estimated)</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            value={calculatedCollateral}
                                            readOnly
                                            className="w-full px-4 py-2 bg-stone-100 border border-zinc-300 rounded-l-md"
                                        />
                                        <select
                                            value={tokenAddress === mockWbtcConfig.address ? 'wbtc' : tokenAddress === mockDaiConfig.address ? 'dai' : 'weth'}
                                            onChange={(e) => handleTokenChange(e.target.value)}
                                            className="px-4 py-2 bg-stone-100 border-t border-b border-r border-zinc-300 rounded-r-md"
                                        >
                                            <option value="wbtc">WBTC</option>
                                            <option value="dai">DAI</option>
                                            <option value="weth">WETH</option>
                                        </select>
                                    </div>
                                    {/* Show loading and error states for sell calculation */}
                                    {isLoading && amountIn > 0 && (
                                        <p className="text-sm text-blue-600 mt-1">🔄 Calculating collateral amount...</p>
                                    )}
                                    {isSellCalcError && amountIn > 0 && (
                                        <p className="text-sm text-red-600 mt-1">❌ Error calculating collateral amount</p>
                                    )}
                                    {amountIn > 0 && !isLoading && !isSellCalcError && calculatedCollateral > 0 && (
                                        <p className="text-sm text-green-600 mt-1">✅ Collateral amount calculated successfully</p>
                                    )}
                                </div>
                                <button onClick={handleSellSubmit} disabled={isLoading} className="w-full mt-4 bg-red-700 text-white py-3 rounded-md hover:bg-red-800 transition font-bold text-lg">
                                    {isLoading ? 'Processing...' : 'Sell LMKT'}
                                </button>
                                {statusMessage && <p className="text-sm text-zinc-600 mt-2">{statusMessage}</p>}
                            </div>
                        )}
                    </div>
                </AccordionSection>

                <AccordionSection title="Portfolio & System Health">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* <LMKTTvChart pairAddress={LMKT_CONFIG.PAIR_ADDRESS} refreshKey={chartRefreshKey} /> */}
                        <div>
                            <div className="h-[500px] rounded-lg overflow-hidden relative">
                                <TradingViewChart symbol='KRAKEN:DAIUSD' />
                            </div>
                        </div>
                        <div>
                            <div className="h-[500px] rounded-lg overflow-hidden relative">
                                <TVChart
                                    widget={widget}
                                    setWidget={setWidget}
                                    data={mockPoolData}
                                    interval={interval}
                                    onLoaded={() => console.log('Chart loaded successfully!')}
                                />
                            </div>
                        </div>
                    </div>
                </AccordionSection>
            </div >
        </div >
    );
};

export default DashboardPage;