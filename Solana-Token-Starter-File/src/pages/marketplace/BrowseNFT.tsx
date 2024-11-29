// src/components/marketplace/BrowseNFT.tsx
import { FC, useState } from 'react';

interface NFT {
  id: number;
  name: string;
  image: string;
  price: number;
  creator: string;
}

const mockNFTs: NFT[] = [
  {
    id: 1,
    name: "Cyber Punk #1",
    image: "/assets/images/nfts/nft1.png",
    price: 1.5,
    creator: "0x8A...3B"
  },
  {
    id: 2,
    name: "Digital Art #2",
    image: "/assets/images/nfts/nft2.png",
    price: 2.3,
    creator: "0x7B...4C"
  },
  {
    id: 3,
    name: "Pixel World #3",
    image: "/assets/images/nfts/nft3.png",
    price: 0.8,
    creator: "0x9C...5D"
  },
  {
    id: 4,
    name: "Meta Collection #4",
    image: "/assets/images/nfts/nft4.png",
    price: 3.1,
    creator: "0x6D...2E"
  },
  {
    id: 5,
    name: "Virtual Reality #5",
    image: "/assets/images/nfts/nft5.png",
    price: 1.9,
    creator: "0x5E...1F"
  },
  {
    id: 6,
    name: "Digital Dreams #6",
    image: "/assets/images/nfts/nft6.png",
    price: 2.7,
    creator: "0x4F...0G"
  }
];

export const BrowseNFT: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');

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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockNFTs.map((nft) => (
          <div key={nft.id} className="bg-gray-800/50 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
            <img 
              src={nft.image}
              alt={nft.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
              <p className="text-gray-400 text-sm mb-2">Created by {nft.creator}</p>
              <div className="flex justify-between items-center">
                <p className="text-purple-500 font-bold">{nft.price} SOL</p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};