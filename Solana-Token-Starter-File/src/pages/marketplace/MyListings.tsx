// src/components/marketplace/MyListings.tsx
import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useListedNFTs } from '../../hooks/useListedNFTs';
import { PulseLoader } from 'react-spinners';
import Image from 'next/image';

export const MyListings: FC = () => {
  const { publicKey } = useWallet();
  const { listings, loading } = useListedNFTs(publicKey || undefined);

  console.log("Current wallet:", publicKey?.toString());
  console.log("Listings:", listings);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4 text-white">My Listed NFTs</h2>
      
      {!publicKey ? (
        <p className="text-center text-gray-400">Please connect your wallet to view listings</p>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <PulseLoader color="#9333ea" />
        </div>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-400">No NFTs listed yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((nft) => (
            <div key={nft.mint.toString()} className="bg-gray-800/50 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative w-full h-64">
                <Image 
                  src={nft.metadata.image || '/assets/images/logo11.png'}
                  alt={nft.metadata.name}
                  width={400}
                  height={400}
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/logo11.png';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{nft.metadata.name}</h3>
                <p className="text-purple-500 font-bold mt-2">{nft.price} SOL</p>
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4"
                  onClick={() => {/* Implement delist */}}
                >
                  Delist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};