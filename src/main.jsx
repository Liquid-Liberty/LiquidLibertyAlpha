import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Imports for wagmi v1 and web3modal v2
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains'; // Import the hardhat chain
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- 0. Create a TanStack Query Client ---
const queryClient = new QueryClient();

// --- 1. Web3Modal & Wagmi v1 Configuration ---
// Define hardhat as the only chain for local development
const chains = [hardhat]; 
const projectId = '71a4eca65a4a5eeed8ea2de7b9d2ab44';

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

// --- 2. Final Render ---
// The Gatekeeper component has been removed to bypass access control for local development.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </WagmiConfig>
    <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
  </React.StrictMode>
);