// src/components/marketplace/NFTCard.tsx
import { FC, useState } from 'react';

interface NFTCardProps {
  id: number;
  name: string;
  image: string;
  creator: string;
  description?: string;
  attributes?: Array<{trait_type: string; value: string}>;
  isListed: boolean;
  inCollection?: boolean;
  price?: number;
}



export const NFTCard: FC<NFTCardProps> = ({
  id,
  name,
  image,
  creator,
  description,
  attributes,
  isListed,
  inCollection,
  price
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative bg-gray-800/50 rounded-xl overflow-hidden">
      <img src={image} alt={name} className="w-full h-64 object-cover"/>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-purple-400 hover:text-purple-300 text-sm mt-2"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>

        {showDetails && (
          <div className="absolute top-full left-0 right-0 bg-gray-800/95 p-4 rounded-b-xl backdrop-blur-sm z-10">
            <h4 className="font-medium text-white mb-2">Details</h4>
            <p className="text-gray-300 text-sm mb-2">{description}</p>
            <p className="text-gray-400 text-sm">Creator: {creator}</p>
            {attributes?.map((attr, index) => (
              <div key={index} className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">{attr.trait_type}:</span>
                <span className="text-white">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Existing buttons */}
        <div className="flex flex-col gap-2 mt-4">
          {/* ... other buttons ... */}
        </div>
      </div>
    </div>
  );
};