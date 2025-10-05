import React from 'react';

const AdBanner = ({ ad }) => (
    <div className="my-8 text-center">
        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src={ad.imageUrl} alt={ad.altText} className="max-w-full h-auto rounded-lg shadow-md" />
        </a>
        <p className="text-xs text-zinc-500 mt-1">Advertisement</p>
    </div>
);

export default AdBanner;
