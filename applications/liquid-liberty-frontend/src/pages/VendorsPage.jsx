import React from 'react';

const VendorsPage = () => {
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
          Under Construction
        </h1>

        <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed">
          Our Vendor Portal is currently under construction, just like the foundations of a new era. We are meticulously crafting an exceptional experience for our merchants. Please check back later for exciting updates!
        </p>

      </div>
    </div>
  );
};

export default VendorsPage;