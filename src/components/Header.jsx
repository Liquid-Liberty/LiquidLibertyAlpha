import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useContractConfig } from "../hooks/useContractConfig";

const Header = ({ onFaucetClick }) => {
  const { mockDaiConfig } = useContractConfig();
  const { isConnected, address } = useAccount();
  const { open } = useWeb3Modal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListingsDropdownOpen, setIsListingsDropdownOpen] = useState(false);
  const [isVendorsDropdownOpen, setIsVendorsDropdownOpen] = useState(false);
  const [isFaucetMenuOpen, setIsFaucetMenuOpen] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();

  const navigate = useNavigate();

  function trimAddress(address, front = 4, back = 4) {
    if (!address || typeof address !== "string") return "";
    if (!address.startsWith("0x") || address.length < front + back + 2)
      return address;

    const start = address.slice(0, front + 2); // include "0x"
    const end = address.slice(-back);
    return `${start}...${end}`;
  }

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsListingsDropdownOpen(false);
    setIsVendorsDropdownOpen(false);
    setIsFaucetMenuOpen(false);
  };

  const handleDropdownBlur = (setter) => {
    setTimeout(() => {
      setter(false);
    }, 150);
  };

  const importTokens = async () => {
    const tokens = [
      { address: mockDaiConfig.address, symbol: "DAI", decimals: 18 },
    ];

    for (const token of tokens) {
      try {
        await window.ethereum.request({
          method: "wallet_watchAsset",
          params: { type: "ERC20", options: token },
        });
      } catch (error) {
        console.error(`Could not add ${token.symbol} to wallet`, error);
      }
    }
  };

  const getTestTokens = () => {
    let faucetUrl = "";
    if (chainId === 11155111) {
      // Sepolia
      faucetUrl = "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";
    } else if (chainId === 943) {
      // PulseChain Testnet
      faucetUrl = "https://faucet.v4.testnet.pulsechain.com/";
    }

    if (faucetUrl) {
      window.open(faucetUrl, "_blank");
    }
  };

  return (
    <header className="bg-stone-50 shadow-md sticky top-0 z-30">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div
          onClick={() => handleNavigate("/")}
          className="text-2xl font-display font-bold text-zinc-900 cursor-pointer"
        >
          Liberty Market
        </div>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsListingsDropdownOpen(!isListingsDropdownOpen)}
              onBlur={() => handleDropdownBlur(setIsListingsDropdownOpen)}
              className="text-zinc-700 hover:text-teal-800 transition duration-300 flex items-center font-bold"
            >
              Listings
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            {isListingsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-stone-50 rounded-md shadow-xl z-20">
                <a
                  onClick={() => handleNavigate("/for-sale")}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  For Sale
                </a>
                <a
                  onClick={() => handleNavigate("/services")}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Services
                </a>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsVendorsDropdownOpen(!isVendorsDropdownOpen)}
              onBlur={() => handleDropdownBlur(setIsVendorsDropdownOpen)}
              className="text-zinc-700 hover:text-teal-800 transition duration-300 flex items-center font-bold"
            >
              Vendors
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            {isVendorsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-stone-50 rounded-md shadow-xl z-20">
                <a
                  onClick={() => handleNavigate("/vendors")}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Become a Vendor
                </a>
                <a
                  onClick={() => handleNavigate("/locate-vendor")}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Locate a Vendor
                </a>
              </div>
            )}
          </div>
          {isConnected && (
            <button
              onClick={() => handleNavigate("/dashboard")}
              className="text-zinc-700 hover:text-teal-800 transition duration-300 font-bold"
            >
              Dashboard
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setIsFaucetMenuOpen(!isFaucetMenuOpen)}
              onBlur={() => handleDropdownBlur(setIsFaucetMenuOpen)}
              className="text-zinc-700 hover:text-teal-800 transition duration-300 font-bold flex items-center"
            >
              Faucet
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            {isFaucetMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-stone-50 rounded-md shadow-xl z-20">
                <a
                  onClick={() => {
                    onFaucetClick();
                    setIsFaucetMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Request Mock Tokens
                </a>
                <a
                  onClick={() => {
                    importTokens();
                    setIsFaucetMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Import Mock Tokens to Wallet
                </a>
                <a
                  onClick={() => {
                    getTestTokens();
                    setIsFaucetMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Get Test Tokens
                </a>
              </div>
            )}
          </div>
          <button
            onClick={() => handleNavigate("/create-listing")}
            className="bg-teal-800 text-stone-100 py-2 px-4 rounded-md hover:bg-teal-900 transition duration-300 font-bold"
          >
            Create a Listing
          </button>
          {/* Wallet + Chain Dropdown */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => open()}
              className="bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition"
            >
              {!isConnected ? "Connect Wallet" : trimAddress(address)}
            </button>
            {isConnected && (
              <div className="relative">
                <select
                  value={chainId}
                  onChange={(e) => {
                    const newChainId = Number(e.target.value);
                    console.log("Attempting to switch to chain:", newChainId);
                    setIsSwitchingChain(true);

                    try {
                      switchChain?.({ chainId: newChainId });
                      console.log(
                        "✅ Chain switch requested, reloading soon..."
                      );
                      setTimeout(() => {
                        console.log("🔄 Calling window.location.reload()");
                        window.location.reload();
                      }, 500);
                    } catch (err) {
                      console.error("Failed to switch chain:", err);
                      setIsSwitchingChain(false);
                    }
                  }}
                  className="appearance-none bg-blue-600 text-white text-center py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  {chains.map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                      className="bg-white text-black"
                    >
                      {x.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {/* Mobile Menu */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-800 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
          {isMobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-stone-50 rounded-md shadow-xl z-20">
              <a
                onClick={() => handleNavigate("/")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Home
              </a>
              {isConnected && (
                <a
                  onClick={() => handleNavigate("/dashboard")}
                  className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
                >
                  Dashboard
                </a>
              )}
              <a
                onClick={() => handleNavigate("/for-sale")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                For Sale
              </a>
              <a
                onClick={() => handleNavigate("/services")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Services
              </a>
              <a
                onClick={() => handleNavigate("/vendors")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Become a Vendor
              </a>
              <a
                onClick={() => handleNavigate("/locate-vendor")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Locate a Vendor
              </a>
              <a
                onClick={() => handleNavigate("/create-listing")}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Create a Listing
              </a>
              <a
                onClick={() => {
                  onFaucetClick();
                  setIsMobileMenuOpen(false);
                }}
                className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer"
              >
                Faucet
              </a>
              <div className="px-2 py-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      open();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition"
                  >
                    {!isConnected ? "Connect Wallet" : trimAddress(address)}
                  </button>
                  {isConnected && (
                    <div className="relative">
                      <select
                        value={chainId}
                        onChange={(e) => {
                          const newChainId = Number(e.target.value);
                          console.log(
                            "Attempting to switch to chain:",
                            newChainId
                          );
                          setIsSwitchingChain(true);

                          try {
                            switchChain?.({ chainId: newChainId });
                            console.log(
                              "✅ Chain switch requested, reloading soon..."
                            );
                            setTimeout(() => {
                              console.log(
                                "🔄 Calling window.location.reload()"
                              );
                              window.location.reload();
                            }, 500);
                          } catch (err) {
                            console.error("Failed to switch chain:", err);
                            setIsSwitchingChain(false);
                          }
                        }}
                        className="appearance-none bg-blue-600 text-white text-center py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition cursor-pointer"
                      >
                        {chains.map((x) => (
                          <option
                            key={x.id}
                            value={x.id}
                            className="bg-white text-black"
                          >
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      {isSwitchingChain && (
        <div className="fixed top-[4rem] inset-0 bg-white flex flex-col items-center justify-center z-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-lg font-semibold text-zinc-700">
            Switching networks...
          </p>
        </div>
      )}
    </header>
  );
};

export default Header;