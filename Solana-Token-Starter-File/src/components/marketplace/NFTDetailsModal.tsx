import { FC } from 'react';
import { NFT } from '@/types/nft';

interface NFTDetailsModalProps {
  nft: NFT;
  onClose: () => void;
  placeholderImage: string;
}

export const NFTDetailsModal: FC<NFTDetailsModalProps> = ({ nft, onClose, placeholderImage }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-white">{nft.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <img 
          src={nft.image || placeholderImage} 
          alt={nft.name} 
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Description</h4>
            <p className="text-gray-300">{nft.description}</p>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Creator</h4>
            <p className="text-gray-300">{nft.creators?.map(creator => creator.address).join(', ')}</p>
          </div>

          {nft.attributes && (
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Attributes</h4>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-700/50 p-2 rounded">
                    <p className="text-gray-400 text-sm">{attr.trait_type}</p>
                    <p className="text-white">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nft.price && (
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Price</h4>
              <p className="text-purple-500 font-bold text-xl">{nft.price} SOL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
