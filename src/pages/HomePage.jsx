import React from 'react';

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

const Content = () => (
    <div className="container mx-auto px-6 pb-16">
        <div className="bg-stone-50/95 p-8 md:p-12 rounded-lg shadow-lg">
            <h2 className="text-4xl font-display font-bold text-zinc-900 mb-4">
                What is Liberty Market?
            </h2>
            <p className="text-zinc-700 leading-loose">
                Liberty Market is a decentralized ecosystem designed to fundamentally re-platform commerce by creating a self-sustaining, circular economy. It addresses the core problems of high merchant fees in traditional finance and the speculative, non-commercial nature of most crypto assets. By integrating a digital marketplace, a real-world payment network, and a novel on-chain protocol, The Market creates a flywheel of value where protocol revenue and user participation perpetually strengthen the ecosystem. Its core pillars are a unique collateralized mint-and-burn token model (MKT), a reputation-based social contract that disincentivizes capital flight, and a robust, tiered dispute resolution system that ensures transactional integrity in a fully anonymous environment.
            </p>
        </div>
    </div>
);

const HomePage = () => (
    <>
        <Hero />
        <Content />
    </>
);

export default HomePage;
