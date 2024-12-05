// src/components/marketplace/BrowseNFT.tsx
import { FC, useState } from 'react';
import { useListedNFTs } from '../../hooks/useListedNFTs';
import { PulseLoader } from 'react-spinners';
import Image from 'next/image';
import { BuyNFTModal } from '../../components/marketplace/BuyNFTModal';
import { NFT, ListedNFT, NFTListing } from '../../types/nft';
import { PublicKey } from '@solana/web3.js';

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const PLACEHOLDER_IMAGE = "/assets/images/logo11.png"; // Updated path

const transformImageUrl = (url: string): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', PINATA_GATEWAY);
  }
  
  if (url.startsWith('Qm')) {
    return `${PINATA_GATEWAY}${url}`;
  }

  return url;
};

export const BrowseNFT: FC = () => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedNFT, setSelectedNFT] = useState<ListedNFT | null>(null);
  const { listings, loading } = useListedNFTs();

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'low') return a.price - b.price;
    if (sortBy === 'high') return b.price - a.price;
    return 0;
  });

  const filteredListings = sortedListings.filter(nft => 
    nft.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertToListedNFT = (nft: any): ListedNFT => {
    if (!nft.price || !nft.seller) {
      throw new Error('Invalid NFT listing data');
    }

    const TREASURY_WALLET = "8kjmpRqSCGHHvcD9DabFjZqsNWKLR86Rfaxwui3z7APi";

    return {
      mint: nft.mint.toString(),
      name: nft.metadata.name,
      symbol: nft.metadata.symbol || '',
      image: nft.metadata.image || PLACEHOLDER_IMAGE,
      description: nft.metadata.description || '',
      price: Number(nft.price),
      seller: nft.seller.toString(),
      treasuryWallet: TREASURY_WALLET,
      isListed: true,
      creators: nft.metadata.creators?.map((creator: any) => ({
        address: creator.address,
        verified: creator.verified || false,
        share: creator.share
      })) || [{
        address: nft.seller.toString(),
        verified: false,
        share: 100
      }],
      metadata: {
        name: nft.metadata.name,
        symbol: nft.metadata.symbol || '',
        description: nft.metadata.description || '',
        image: nft.metadata.image || PLACEHOLDER_IMAGE,
        attributes: nft.metadata.attributes || []
      }
    };
  };

  const handleBuyClick = (listing: any) => {
    const nft = convertToListedNFT(listing);
    setSelectedNFT(nft);
  };

  const handleBuySuccess = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <input 
            type="text"
            placeholder="Search NFTs..."
            className="bg-gray-800/50 text-white rounded-lg px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="bg-gray-800/50 text-white rounded-lg px-4 py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <PulseLoader color="#9333ea" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((nft) => (
            <div key={nft.mint.toString()} className="bg-gray-800/50 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
              <Image 
                src={nft.metadata.image || '/assets/images/logo11.png'}
                alt={nft.metadata.name}
                width={400}
                height={400}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/logo11.png';
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{nft.metadata.name}</h3>
                <p className="text-gray-400 text-sm mb-2">
                  Seller: {nft.seller.toString().slice(0,4)}...{nft.seller.toString().slice(-4)}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-purple-500 font-bold">{nft.price} SOL</p>
                  <button 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    onClick={() => handleBuyClick(nft)}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNFT && (
        <BuyNFTModal
          nft={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  );
};