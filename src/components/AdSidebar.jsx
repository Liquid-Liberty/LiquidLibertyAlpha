import React from 'react';

const AdSidebar = ({ ad }) => (
    <div className="w-full">
        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src={ad.imageUrl} alt={ad.altText} className="w-full h-auto rounded-lg shadow-md" />
        </a>
        <p className="text-xs text-zinc-500 mt-1 text-center">Advertisement</p>
    </div>
);

export default AdSidebar;
