import React from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite, useWalletClient } from 'wagmi';
import { contractConfig } from '../contract-config.js';

// Reusable component for adding any token to a user's wallet
const ImportTokenButton = ({ tokenAddress, tokenSymbol, tokenDecimals, isPrimary = false }) => {
    const { data: walletClient } = useWalletClient();

    const handleImport = async () => {
        if (!walletClient) return;

        try {
            await walletClient.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: tokenDecimals,
                    },
                },
            });
        } catch (error) {
            console.error(`Error adding ${tokenSymbol} to wallet:`, error);
        }
    };

    const baseClasses = "font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed";
    const primaryClasses = "bg-zinc-800 hover:bg-zinc-900 text-white";
    const secondaryClasses = "bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm";

    return (
        <button
            onClick={handleImport}
            disabled={!walletClient}
            className={`${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`}
        >
            Add {tokenSymbol} to Wallet
        </button>
    );
};


const Hero = () => (
    <div className="relative py-32 md:py-48">
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-4">
            <h1 className="text-5xl md:text-7xl font-display font-bold drop-shadow-lg">
                Welcome to Liberty Market
            </h1>
            <p className="text-lg md:text-xl mt-4 font-body italic text-stone-300">Where crypto becomes what it was born to be</p>
        </div>
    </div>
);

const Faucet = () => {
    const { isConnected } = useAccount();

    const { config } = usePrepareContractWrite({
        address: contractConfig.faucet.address,
        abi: contractConfig.faucet.abi,
        functionName: 'requestTokens',
        enabled: isConnected,
    });

    const { data: txData, isLoading: isTxLoading, isSuccess, error, write } = useContractWrite(config);

    if (!isConnected) {
        return null;
    }

    return (
        <div className="container mx-auto px-6 pb-16 -mt-16">
            <div className="bg-sky-50/95 p-8 md:p-12 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-display font-bold text-zinc-900 mb-4">
                    Get Tokens for Testing
                </h2>
                <p className="text-zinc-700 leading-loose mb-6">
                    Use the Faucet to get a fresh supply of LBRTY and other tokens for testing the marketplace features.
                </p>
                <button
                    onClick={() => write?.()}
                    disabled={!write || isTxLoading}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isTxLoading ? 'Requesting...' : 'Get Test Tokens from Faucet'}
                </button>

                {isSuccess && <div className="mt-4 text-sm text-green-600"><strong>Transaction successful!</strong> Hash: {txData?.hash}</div>}
                {error && (
                    <div className="mt-4 text-sm text-red-600">
                        <strong>Error:</strong> {error.shortMessage || error.message}
                    </div>
                )}
                <div className="border-t mt-6 pt-6">
                    <p className="text-zinc-600 mb-4">Import the mock collateral tokens to see them in your wallet:</p>
                    <div className="flex flex-wrap justify-center items-center gap-3">
                        <ImportTokenButton tokenAddress="0x5FbDB2315678afecb367f032d93F642f64180aa3" tokenSymbol="DAI" tokenDecimals={18} />
                        <ImportTokenButton tokenAddress="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" tokenSymbol="WETH" tokenDecimals={18} />
                        <ImportTokenButton tokenAddress="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" tokenSymbol="WBTC" tokenDecimals={8} />
                        <ImportTokenButton tokenAddress="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" tokenSymbol="PLS" tokenDecimals={18} />
                    </div>
                </div>
            </div>
        </div>
    );
};


const Content = () => {
    return (
        <div className="container mx-auto px-6 pb-16">
            <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
                <h2 className="text-4xl font-display font-bold text-zinc-900 mb-4">
                    What is Liberty Market?
                </h2>
                <p className="text-zinc-700 leading-loose">
                    Liberty Market is a decentralized ecosystem designed to fundamentally re-platform commerce by creating a self-sustaining, circular economy. It addresses the core problems of high merchant fees in traditional finance and the speculative, non-commercial nature of most crypto assets. By integrating a digital marketplace, a real-world payment network, and a novel on-chain protocol, The Market creates a flywheel of value where protocol revenue and user participation perpetually strengthen the ecosystem. Its core pillars are a unique collateralized mint-and-burn token model (MKT), a reputation-based social contract that disincentivizes capital flight, and a robust, tiered dispute resolution system that ensures transactional integrity in a fully anonymous environment.
                </p>
                <div className="mt-8 text-center">
                    <ImportTokenButton
                        tokenAddress={contractConfig.lmkt.address}
                        tokenSymbol="LMKT"
                        tokenDecimals={18}
                        isPrimary={true}
                    />
                </div>
            </div>
        </div>
    );
};

const HomePage = () => (
    <>
        <Hero />
        <Faucet />
        <Content />
    </>
);

export default HomePage;