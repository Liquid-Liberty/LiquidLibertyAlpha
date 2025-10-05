// This file holds all our mock data to keep other files clean.

// --- Detailed mock listings for the user's dashboard ---
export const userListings = [
    {
        id: 1,
        title: "Vintage Leather Briefcase",
        price: 75.00,
        status: 'active', // active, escrow, dispute, completed, expired
        date: new Date(),
        ipfsHash: 'Qm...',
        photos: [{ preview: "https://placehold.co/600x400/d1c7b7/333333?text=Briefcase+1" }],
    },
    {
        id: 2,
        title: "Antique Silver Locket",
        price: 120.00,
        status: 'escrow',
        date: new Date(),
        buyerAddress: '0x1234...abcd',
        ipfsHash: 'Qm...',
        photos: [{ preview: "https://placehold.co/600x400/c0c0c0/333333?text=Locket" }],
    },
     {
        id: 5,
        title: "DJ Services for Events",
        price: 400.00,
        status: 'dispute',
        date: new Date(),
        buyerAddress: '0x5678...efgh',
        ipfsHash: 'Qm...',
        photos: [{ preview: "https://placehold.co/600x400/8A2BE2/ffffff?text=DJ" }],
    },
    {
        id: 3,
        title: "Handmade Oak Bookshelf",
        price: 250.00,
        status: 'completed',
        date: new Date('2024-05-20T10:00:00Z'),
        buyerAddress: '0x9101...ijkl',
        ipfsHash: 'Qm...',
        photos: [{ preview: "https://placehold.co/600x400/8b4513/ffffff?text=Bookshelf" }],
    },
    {
        id: 4,
        title: "Graphic Design & Logo Creation",
        price: 50.00,
        status: 'expired',
        date: new Date('2024-04-11T09:00:00Z'),
        ipfsHash: 'Qm...',
        photos: [{ preview: "https://placehold.co/600x400/2a9d8f/ffffff?text=Creative+Services" }],
    },
];


// --- Other mock data remains the same ---

export const serviceCategories = [
    { key: "automotive", name: "Automotive" },
    { key: "beauty", name: "Beauty" },
    { key: "cell-mobile", name: "Cell/Mobile" },
    { key: "computer", name: "Computer" },
    { key: "creative", name: "Creative" },
    { key: "cycle", name: "Cycle" },
    { key: "event", name: "Event" },
];

export const mockAds = {
    banner: {
        link: '#',
        imageUrl: 'https://placehold.co/970x90/a9a9a9/333333?text=Your+Ad+Here',
        altText: 'Banner Advertisement'
    },
    sidebar: {
        link: '#',
        imageUrl: 'https://placehold.co/300x250/a9a9a9/333333?text=Your+Ad+Here',
        altText: 'Sidebar Advertisement'
    }
};

// --- NEW: Data for Vendor Simulator Templates ---
export const vendorTemplates = [
    {
        id: 'landscaping',
        name: 'Small Landscaping Business',
        annualSales: 150000,
        cardPercentage: 60,
        logo: 'https://placehold.co/100x100/228B22/ffffff?text=LS',
        description: 'Specializing in residential lawn care and garden maintenance.'
    },
    {
        id: 'convenience_store',
        name: 'Convenience Store',
        annualSales: 450000,
        cardPercentage: 85,
        logo: 'https://placehold.co/100x100/FF4500/ffffff?text=CS',
        description: 'Your neighborhood stop for snacks, drinks, and essentials.'
    },
    {
        id: 'law_firm',
        name: 'Boutique Law Firm',
        annualSales: 1200000,
        cardPercentage: 95,
        logo: 'https://placehold.co/100x100/4682B4/ffffff?text=LF',
        description: 'Providing expert legal services for small businesses and individuals.'
    },
     {
        id: 'coffee_shop',
        name: 'Independent Coffee Shop',
        annualSales: 250000,
        cardPercentage: 90,
        logo: 'https://placehold.co/100x100/8B4513/ffffff?text=☕',
        description: 'Serving artisanal coffee and locally-sourced pastries.'
    }
];
