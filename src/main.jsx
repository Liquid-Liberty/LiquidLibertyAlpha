import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ListingsProvider } from './context/ListingsContext';

// --- wagmi and web3modal imports ---
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider, useAccount } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { sepolia } from 'wagmi/chains';

// --- 0. Create a TanStack Query Client ---
const queryClient = new QueryClient();

// --- 1. ADDED: Define Your Local Hardhat Chain ---
const hardhatLocalNode = defineChain({
    id: 31337,
    name: 'Hardhat Local Node',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
    testnet: true,
});

// --- 2. Select chains based on ENV ---
const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV;
const chains = DEPLOY_ENV === 'sepolia' ? [sepolia] : [hardhatLocalNode];

// --- 2. Web3Modal & Wagmi v2 Configuration ---
const projectId = '71a4eca65a4a5eeed8ea2de7b9d2ab44'; // This can be a public value

const metadata = {
  name: 'Liberty Market',
  description: 'Access the Liberty Market DApp.',
  url: 'http://localhost:5173', // Changed for local dev
  icons: ['/your-logo.png']
};

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  // Optional: Enable wallet reconnect
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

createWeb3Modal({ wagmiConfig, projectId, chains });

// --- 3. Token Gating Configuration (Kept for your reference) ---
const TOKEN_CONTRACT_ADDRESS = '0x42803364944a0ca4c8f1cb049834f69e383c7a45';
const REQUIRED_BALANCE = 40;

// --- 4. Screen Components (Unchanged) ---
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
// Other screen components (AccessDeniedScreen, ErrorScreen) remain unchanged...

// --- 5. The Gatekeeper Component (Unchanged) ---
function Gatekeeper() {
    const { isConnected } = useAccount();
    const { open } = useWeb3Modal();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        if (!isConnected) {
            setStatus('idle');
        } else {
            // Logic is currently bypassed to grant access once connected
            setStatus('granted');
        }
    }, [isConnected]);

    if (status === 'loading') {
        return <LoadingScreen message="Initializing..." />;
    }
    if (status === 'idle') {
        return <ConnectWalletScreen onConnect={() => open()} />;
    }
    if (status === 'granted') {
        return <App />;
    }

    return <ConnectWalletScreen onConnect={() => open()} />;
}

// --- 6. Final Render (Unchanged) ---
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