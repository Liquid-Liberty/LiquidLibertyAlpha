import React, { useState } from 'react';
// --- REMOVED: No longer using custom context for address ---
// import { UserContext } from '../context/UserContext';
// --- ADDED: Standard wagmi hook to get account info ---
import { useAccount } from 'wagmi';
import { vendorTemplates } from '../data/mockData';

const MAX_ANNUAL_SALES = 5000000; // Cap at $5 million

const VendorSimulator = () => {
    // --- UPDATED: Get address directly from wagmi's useAccount hook ---
    const { address } = useAccount();

    // State for the form inputs
    const [mode, setMode] = useState('template'); // 'template' or 'custom'
    const [vendorName, setVendorName] = useState('');
    const [logoPreview, setLogoPreview] = useState('');
    const [annualSales, setAnnualSales] = useState(vendorTemplates[0].annualSales);
    const [cardPercentage, setCardPercentage] = useState(vendorTemplates[0].cardPercentage);
    
    // State to manage the simulation results and submission status
    const [simulationResult, setSimulationResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');

    const PLATFORM_FEE = 0.0005;

    // Update form fields when a template is selected
    const handleTemplateSelect = (templateId) => {
        const template = vendorTemplates.find(t => t.id === templateId);
        if (template) {
            setVendorName(template.name);
            setAnnualSales(template.annualSales);
            setCardPercentage(template.cardPercentage);
            setLogoPreview(template.logo);
        }
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionError('');
        
        const salesVolume = Math.min(parseFloat(annualSales) || 0, MAX_ANNUAL_SALES);
        const percentage = parseFloat(cardPercentage) || 0;
        const cardVolume = salesVolume * (percentage / 100);
        const dailyFeeRevenue = (cardVolume * PLATFORM_FEE) / 365;

        const submissionData = {
            name: vendorName || "Custom Vendor", // Use state for name
            wallet: address,
            totalRevenue: dailyFeeRevenue,
            annualSales: salesVolume,
            cardPercentage: percentage,
            logo: logoPreview,
        };

        setSimulationResult(submissionData);

        try {
            const response = await fetch('/.netlify/functions/submit-vendor-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed.');
            }

            const result = await response.json();
            setIpfsHash(result.ipfsHash);

        } catch (error) {
            setSubmissionError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (ipfsHash) {
        return (
             <div className="mt-10 p-6 bg-green-50 border-2 border-green-200 rounded-lg shadow-lg animate-fade-in text-center">
                <h3 className="text-2xl font-bold text-green-800">Simulation Submitted!</h3>
                <p className="text-zinc-700 mt-2">Thank you for participating. You have created the following mock vendor profile:</p>
                
                <div className="mt-4 inline-block bg-white p-4 rounded-lg">
                    {simulationResult.logo && <img src={simulationResult.logo} alt="Vendor Logo" className="h-20 w-20 rounded-full mb-3 mx-auto" />}
                    <p className="text-xl font-bold">{simulationResult.name}</p>
                    <p className="text-xs text-zinc-500 break-all">{simulationResult.wallet}</p>
                </div>

                <div className="mt-6">
                    <p className="text-lg font-semibold text-zinc-700">Simulated Daily Treasury Revenue:</p>
                    <p className="text-4xl font-bold text-teal-800">${simulationResult.totalRevenue.toFixed(2)}</p>
                </div>
                <p className="text-center text-sm text-zinc-600 mt-6">
                    Your submission has been permanently recorded to IPFS. The dev team will settle all submissions daily.
                </p>
                <p className="mt-2 text-xs text-zinc-500 break-all">Receipt (IPFS CID): <a href={`https://ipfs.io/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ipfsHash}</a></p>
                 <button onClick={() => setIpfsHash('')} className="mt-6 text-sm text-blue-600 hover:underline">Run Another Simulation</button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-zinc-800">Vendor Revenue Simulator</h3>
                <p className="text-zinc-600 mt-1">Choose a template or create a custom profile to see your potential impact.</p>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex justify-center bg-stone-200 rounded-lg p-1">
                <button onClick={() => setMode('template')} className={`px-6 py-2 rounded-md font-bold w-1/2 ${mode === 'template' ? 'bg-teal-800 text-white' : 'text-zinc-700'}`}>Use a Template</button>
                <button onClick={() => setMode('custom')} className={`px-6 py-2 rounded-md font-bold w-1/2 ${mode === 'custom' ? 'bg-teal-800 text-white' : 'text-zinc-700'}`}>Create Custom</button>
            </div>

            {mode === 'template' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendorTemplates.map(template => (
                        <button key={template.id} onClick={() => handleTemplateSelect(template.id)} className="bg-white p-4 rounded-lg shadow text-left hover:shadow-lg hover:border-teal-500 border-2 border-transparent transition">
                            <div className="flex items-center">
                                <img src={template.logo} alt={template.name} className="h-12 w-12 rounded-full mr-4"/>
                                <div>
                                    <p className="font-bold text-zinc-800">{template.name}</p>
                                    <p className="text-xs text-zinc-600">{template.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-6 bg-stone-100 p-8 rounded-lg shadow-md">
                {mode === 'custom' && (
                    <div>
                        <label htmlFor="vendorName" className="block text-sm font-bold text-zinc-700 mb-2">Custom Company Name</label>
                        <input type="text" id="vendorName" value={vendorName} onChange={e => setVendorName(e.target.value)} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md" />
                    </div>
                )}
                
                <h4 className="text-lg font-bold text-center text-zinc-700 pt-4 border-t">Adjust Financials</h4>
                <div>
                    <label htmlFor="annualSales" className="block text-sm font-bold text-zinc-700 mb-2">
                        Annual Sales: <span className="text-teal-800 font-mono">${parseInt(annualSales).toLocaleString()}</span>
                    </label>
                    <input type="range" id="annualSales" min="10000" max={MAX_ANNUAL_SALES} step="10000" value={annualSales} onChange={e => setAnnualSales(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                    <p className="text-xs text-zinc-500 text-right">Max: ${MAX_ANNUAL_SALES.toLocaleString()}</p>
                </div>
                <div>
                    <label htmlFor="cardPercentage" className="block text-sm font-bold text-zinc-700 mb-2">
                        % Paid by Card: <span className="text-teal-800 font-mono">{cardPercentage}%</span>
                    </label>
                    <input type="range" id="cardPercentage" min="0" max="100" value={cardPercentage} onChange={e => setCardPercentage(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                </div>
                
                <div className="text-center pt-4">
                    <button type="submit" disabled={isSubmitting} className="bg-teal-600 text-white py-3 px-8 rounded-md hover:bg-teal-700 transition duration-300 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Submitting to IPFS...' : 'Submit Simulation Data'}
                    </button>
                    {submissionError && (
                        <p className="text-red-600 mt-4 text-sm">
                            Error: {submissionError}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default VendorSimulator;