import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ListingsProvider } from './context/ListingsContext';

// --- NEW IMPORTS for wagmi v2 and web3modal v4 ---
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider, useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains'; // For local development
import { useWeb3Modal } from '@web3modal/wagmi/react'; // New hook for opening the modal
import { defineChain, formatUnits } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Note: `readContract` is now imported directly from 'wagmi/actions' if needed, but the wagmi hooks are preferred.

// --- 0. Create a TanStack Query Client (Unchanged) ---
const queryClient = new QueryClient();

// --- 1. Define Your Chains ---
const customSepolia = defineChain({
    id: 11155111,
    name: 'Sepolia Testnet',
    nativeCurrency: { name: 'tETH', symbol: 'tETH', decimals: 18 },
    rpcUrls: {
        default: { 
            http: [
                'https://ethereum-sepolia-rpc.publicnode.com',
                'https://rpc.sepolia.org',
                'https://rpc2.sepolia.org',
                'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                'https://eth-sepolia.g.alchemy.com/v2/demo'
            ] 
        },
    },
    blockExplorers: {
        default: { name: 'Sepolia Scan', url: 'https://sepolia.etherscan.io/' },
    },
    testnet: true,
});

// --- 2. NEW Web3Modal & Wagmi v2 Configuration ---
const projectId = '71a4eca65a4a5eeed8ea2de7b9d2ab44';

const metadata = {
  name: 'Liberty Market',
  description: 'Access the Liberty Market DApp.',
  url: 'https://your-dapp-url.com', // Replace with your actual URL
  icons: ['/your-logo.png'] // Replace with your actual logo
};

const chains = [customSepolia];
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata
});

createWeb3Modal({ wagmiConfig, projectId, chains });

// --- 3. Token Gating Configuration (Kept for reference, as in original file) ---
const TOKEN_CONTRACT_ADDRESS = '0x42803364944a0ca4c8f1cb049834f69e383c7a45';
const REQUIRED_BALANCE = 40;
const MINIMAL_ERC20_ABI = [{
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}];

// --- 4. Screen Components for Clarity (All components restored) ---
const ScreenWrapper = ({ children }) => (
    <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-800 text-white" style={{ backgroundImage: "url('/market-background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative text-center p-10 bg-stone-900/80 backdrop-blur-sm rounded-lg shadow-2xl border border-stone-700">
            {children}
        </div>
    </div>
);
const LoadingScreen = ({ message }) => (
    <div className="flex justify-center items-center min-h-screen bg-zinc-900">
        <p className="text-2xl font-bold animate-pulse text-white">{message}</p>
    </div>
);
const ConnectWalletScreen = ({ onConnect }) => (
    <ScreenWrapper>
        <h1 className="text-4xl font-display font-bold mb-4">Welcome to Liberty Market</h1>
        <p className="text-stone-300 mb-8">Connect your wallet to access the DApp.</p>
        <button onClick={onConnect} className="bg-teal-800 text-stone-100 py-3 px-12 rounded-md hover:bg-teal-900 transition duration-300 font-bold text-xl shadow-lg">
            Connect Wallet
        </button>
    </ScreenWrapper>
);
const AccessDeniedScreen = ({ balance }) => (
    <ScreenWrapper>
        <h1 className="text-3xl font-display font-bold mb-4 text-red-400">Access Denied</h1>
        <p className="text-stone-300 mb-4">You must hold at least {REQUIRED_BALANCE} LBRTY tokens.</p>
        <div className="bg-stone-800 p-4 rounded-lg">
            <p className="text-lg">Your current balance:</p>
            <p className="text-2xl font-bold text-teal-400">{balance.toFixed(4)} LBRTY</p>
        </div>
        <p className="mt-6 text-xs text-stone-400">Token Contract: <code className="bg-zinc-700 p-1 rounded break-all">{TOKEN_CONTRACT_ADDRESS}</code></p>
    </ScreenWrapper>
);
const ErrorScreen = () => (
     <ScreenWrapper>
        <h1 className="text-3xl font-bold mb-4 text-yellow-400">Network Error</h1>
        <p>Could not verify your token balance. The RPC may be unstable. Please refresh the page.</p>
    </ScreenWrapper>
);

// --- 5. The Gatekeeper Component (Logic Updated for new hooks) ---
function Gatekeeper() {
    const { address, isConnected } = useAccount();
    const { open } = useWeb3Modal();

    const [status, setStatus] = useState('loading');
    const [balance, setBalance] = useState(0); // Kept state in case you re-implement logic

    useEffect(() => {
        // Your logic to bypass token gating, as in the original file
        if (!isConnected) {
            setStatus('idle');
        } else {
            setStatus('granted');
        }
    }, [isConnected, address]);

    if (status === 'loading') {
        return <LoadingScreen message="Initializing..." />;
    }
    if (status === 'idle') {
        return <ConnectWalletScreen onConnect={() => open()} />;
    }
    if (status === 'granted') {
        return <App />;
    }
    // The other status cases from your original logic would go here if re-enabled
    // e.g., 'denied', 'error'

    return <ConnectWalletScreen onConnect={() => open()} />; // Fallback
}

// --- 6. Final Render (Updated for new provider) ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ListingsProvider>
                    <Gatekeeper />
                </ListingsProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);