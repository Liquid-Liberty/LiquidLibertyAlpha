import React from 'react';

const RewardsPage = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col items-center justify-center text-center bg-stone-50/95 p-8 md:p-16 rounded-lg shadow-lg max-w-4xl mx-auto">
        
        {/* Under Construction Graphic */}
        <div className="mb-8 max-w-lg w-full">
          <img 
            src="/Underconstruction.png" 
            alt="Colonial era person building a brick wall, symbolizing 'under construction'" 
            className="rounded-lg shadow-md w-full h-auto"
          />
        </div>

        <h1 className="text-5xl font-display font-bold text-zinc-800 mb-4">
          Rewards & Staking Coming Soon
        </h1>

        <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed">
          Get ready to put your assets to work. Our rewards and staking portal is currently being built. Check back soon to learn how you can earn yield and participate in the ecosystem's growth!
        </p>

      </div>
    </div>
  );
};

export default RewardsPage;