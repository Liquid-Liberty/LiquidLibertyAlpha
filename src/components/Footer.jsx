import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
    <footer className="bg-stone-800 text-stone-300 mt-auto">
        <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div>
                    <h3 className="font-display font-bold text-lg text-white mb-4">Liberty Market</h3>
                    <p className="text-sm">A decentralized marketplace for a new era of commerce.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link to="/for-sale" className="hover:text-teal-400 transition">For Sale</Link></li>
                        <li><Link to="/services" className="hover:text-teal-400 transition">Services</Link></li>
                        <li><Link to="/dashboard" className="hover:text-teal-400 transition">My Dashboard</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white mb-4">Support</h3>
                    <ul className="space-y-2">
                        {/* These routes don't exist yet, but can be added later */}
                        <li><Link to="/faq" className="hover:text-teal-400 transition">FAQ</Link></li>
                        <li><Link to="/contact" className="hover:text-teal-400 transition">Contact Us</Link></li>
                        <li><Link to="/terms" className="hover:text-teal-400 transition">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
            <div className="text-center text-stone-400 text-sm mt-8 pt-8 border-t border-stone-700">
                <p>&copy; {new Date().getFullYear()} Liberty Market. All Rights Reserved.</p>
            </div>
        </div>
    </footer>
);

export default Footer;
