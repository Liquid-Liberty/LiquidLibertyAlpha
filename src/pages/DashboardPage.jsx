import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import MyListings from '../components/MyListings';
import { useContractReads } from 'wagmi';
import { formatUnits } from 'viem';

// Import local contract configurations
import { contractConfig } from '../contract-config.js';

// Updated: Added coingeckoId for fetching live prices
const LOCAL_COLLATERAL_TOKENS = [
    { name: 'MockDAI', symbol: 'DAI', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', decimals: 18, coingeckoId: 'dai' },
    { name: 'MockWETH', symbol: 'WETH', address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', decimals: 18, coingeckoId: 'ethereum' },
    { name: 'MockWBTC', symbol: 'WBTC', address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', decimals: 8, coingeckoId: 'bitcoin' },
    { name: 'MockPLS', symbol: 'PLS', address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', decimals: 18, coingeckoId: 'pulsechain' },
];

// Minimal ABI for ERC20 balanceOf function
const erc20BalanceOfAbi = [{
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
}];

// New Hook: Fetches prices from the Netlify proxy function
const useCoinGeckoPrices = (tokenIds) => {
    const [prices, setPrices] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (tokenIds.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchPrices = async () => {
            setIsLoading(true);
            try {
                // Construct the query to your proxy function
                const ids = tokenIds.join(',');
                const response = await fetch(`/.netlify/functions/coingecko-proxy?ids=${ids}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const priceMap = {};
                for (const id in data) {
                    priceMap[id] = data[id].usd;
                }
                setPrices(priceMap);
            } catch (error) {
                console.error("Could not fetch token prices:", error);
                // Set prices to 0 on error to prevent crashes in calculation
                const errorPriceMap = tokenIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
                setPrices(errorPriceMap);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrices();
    }, [tokenIds.join(',')]); // Effect dependency on the joined string of IDs

    return { prices, isLoading: isLoading };
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

// Updated: Component now displays balance, price, and total value
const BalanceDisplayCard = ({ name, balance, symbol, price, isLoading }) => {
    const balanceNum = balance ? parseFloat(balance) : 0;
    const totalValue = balanceNum * (price || 0);

    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col justify-between h-full">
            <div>
                <h4 className="text-lg font-bold text-zinc-500 mb-2">{name}</h4>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                ) : (
                    <>
                        <p className="text-4xl font-mono font-bold text-zinc-800">
                            {balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            <span className="text-2xl text-zinc-600"> {symbol}</span>
                        </p>
                        <p className="font-mono text-zinc-500">
                            @ {formatCurrency(price || 0)}
                        </p>
                    </>
                )}
            </div>
            <div className="mt-4 pt-4 border-t">
                 <p className="text-xs text-gray-400">Total Treasury Value</p>
                 <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalValue)}</p>
            </div>
        </div>
    );
};


const DashboardPage = () => {
    const currentUser = useContext(UserContext);
    const { prices, isLoading: arePricesLoading } = useCoinGeckoPrices(LOCAL_COLLATERAL_TOKENS.map(t => t.coingeckoId));

    const treasuryCollateralContracts = LOCAL_COLLATERAL_TOKENS.map(token => ({
        address: token.address,
        abi: erc20BalanceOfAbi,
        functionName: 'balanceOf',
        args: [contractConfig.treasury.address],
    }));

    const { data: balances, isLoading: areBalancesLoading } = useContractReads({
        contracts: treasuryCollateralContracts,
        watch: true,
    });

    if (!currentUser?.isConnected) {
        return <div className="p-8 text-center text-xl">Please connect your wallet to view the dashboard.</div>;
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h1 className="text-4xl font-display font-bold text-zinc-800 mb-8">Dashboard</h1>
                
                <AccordionSection title="My Listings" defaultOpen={true}>
                    <MyListings />
                </AccordionSection>

                <AccordionSection title="Treasury Collateral Balances" defaultOpen={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {LOCAL_COLLATERAL_TOKENS.map((token, index) => {
                            const balanceResult = balances?.[index];
                            const formattedBalance = balanceResult?.status === 'success' 
                                ? formatUnits(balanceResult.result, token.decimals) 
                                : '0';
                            
                            const price = prices[token.coingeckoId];

                            return (
                                <BalanceDisplayCard
                                    key={token.name}
                                    name={token.name}
                                    balance={formattedBalance}
                                    symbol={token.symbol}
                                    price={price}
                                    isLoading={areBalancesLoading || arePricesLoading}
                                />
                            );
                        })}
                    </div>
                </AccordionSection>
            </div>
        </div>
    );
};

export default DashboardPage;