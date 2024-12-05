// src/components/marketplace/NFTCard.tsx
import { FC } from 'react';
import { NFT } from '@/types/nft';

interface NFTCardProps {
  nft: NFT;
  onSelect: (nft: NFT) => void;
  placeholderImage: string;
}

export const NFTCard: FC<NFTCardProps> = ({ nft, onSelect, placeholderImage }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div 
        className="relative group cursor-pointer"
        onClick={() => onSelect(nft)}
      >
        <img 
          src={nft.image || placeholderImage} 
          alt={nft.name} 
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View Details
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{nft.name}</h3>
        <div className="flex flex-col gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log(`List NFT ${nft.mint}`);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            List for Sale
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Update metadata ${nft.mint}`);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Update Metadata
          </button>
        </div>
      </div>
    </div>
  );
};