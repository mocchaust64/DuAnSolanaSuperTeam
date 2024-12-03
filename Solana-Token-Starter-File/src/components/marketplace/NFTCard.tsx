// src/components/marketplace/NFTCard.tsx
import { FC, useState } from 'react';
import Image from 'next/image';

interface NFTCardProps {
  id: string;
  name: string;
  symbol: string;
  image: string;
  description?: string;
  attributes?: Array<{trait_type: string; value: string}>;
  creator: string;
  isListed: boolean;
  price?: number;
}

export const NFTCard: FC<NFTCardProps> = ({
  id,
  name,
  symbol,
  image,
  description,
  attributes,
  creator,
  isListed,
  price
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Ảnh NFT */}
      <div className="relative aspect-square">
        <Image
          src={image}
          alt={name}
          layout="fill"
          objectFit="cover"
          className="transition-transform hover:scale-105"
        />
      </div>

      {/* Thông tin cơ bản */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">{symbol}</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded text-white text-sm transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Chi tiết NFT - chỉ hiện khi click */}
        {showDetails && (
          <div className="mt-4 space-y-2 text-gray-300">
            <p><span className="font-semibold">Name:</span> {name}</p>
            <p><span className="font-semibold">Description:</span> {description}</p>
            <p><span className="font-semibold">Creator:</span> {creator}</p>
            
            {attributes && attributes.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Attributes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {attributes.map((attr, index) => (
                    <div key={index} className="bg-gray-700 p-2 rounded">
                      <p className="text-sm font-medium">{attr.trait_type}</p>
                      <p className="text-sm">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isListed && price && (
              <p>
                <span className="font-semibold">Price:</span> {price} SOL
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};