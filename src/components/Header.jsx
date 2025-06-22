import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react'


const Header = ({ onFaucetClick }) => {
    const { isConnected } = useAccount();
    const { open } = useWeb3Modal();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isListingsDropdownOpen, setIsListingsDropdownOpen] = useState(false);
    const [isVendorsDropdownOpen, setIsVendorsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsListingsDropdownOpen(false);
        setIsVendorsDropdownOpen(false);
    };
    
    // Function to close dropdowns when clicking away
    const handleDropdownBlur = (setter) => {
        setTimeout(() => {
            setter(false);
        }, 150); // a small delay helps register clicks on dropdown items
    };

    return (
        <header className="bg-stone-50 shadow-md sticky top-0 z-30">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div onClick={() => handleNavigate('/')} className="text-2xl font-display font-bold text-zinc-900 cursor-pointer">
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
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {isListingsDropdownOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-stone-50 rounded-md shadow-xl z-20">
                                <a onClick={() => handleNavigate('/for-sale')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">For Sale</a>
                                <a onClick={() => handleNavigate('/services')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Services</a>
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
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {isVendorsDropdownOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-stone-50 rounded-md shadow-xl z-20">
                                <a onClick={() => handleNavigate('/vendors')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Become a Vendor</a>
                                <a onClick={() => handleNavigate('/locate-vendor')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Locate a Vendor</a>
                            </div>
                        )}
                    </div>
                    {isConnected && (
                        <button onClick={() => handleNavigate('/dashboard')} className="text-zinc-700 hover:text-teal-800 transition duration-300 font-bold">
                            Dashboard
                        </button>
                    )}
                    <button onClick={onFaucetClick} className="text-zinc-700 hover:text-teal-800 transition duration-300 font-bold">
                        Faucet
                    </button>
                    <button onClick={() => handleNavigate('/create-listing')} className="bg-teal-800 text-stone-100 py-2 px-4 rounded-md hover:bg-teal-900 transition duration-300 font-bold">
                        Create a Listing
                    </button>
                    <button onClick={() => open()} className="bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition">Connect Wallet</button>
                </div>

                 {/* Mobile Menu */}
                <div className="md:hidden relative">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-800 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                    {isMobileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-stone-50 rounded-md shadow-xl z-20">
                            <a onClick={() => handleNavigate('/')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Home</a>
                            {isConnected && <a onClick={() => handleNavigate('/dashboard')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Dashboard</a>}
                            <a onClick={() => handleNavigate('/for-sale')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">For Sale</a>
                            <a onClick={() => handleNavigate('/services')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Services</a>
                            <a onClick={() => handleNavigate('/vendors')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Become a Vendor</a>
                            <a onClick={() => handleNavigate('/locate-vendor')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Locate a Vendor</a>
                            <a onClick={() => handleNavigate('/create-listing')} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Create a Listing</a>
                            <a onClick={() => { onFaucetClick(); setIsMobileMenuOpen(false); }} className="block px-4 py-2 text-zinc-800 hover:bg-teal-800 hover:text-white cursor-pointer">Faucet</a>
                            <div className="px-2 py-2">
                                <button onClick={() => {open(); setIsMobileMenuOpen(false);}} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition">Connect Wallet</button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
