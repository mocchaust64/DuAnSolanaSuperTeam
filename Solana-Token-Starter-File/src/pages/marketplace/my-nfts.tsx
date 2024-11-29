// src/pages/marketplace/my-nfts.tsx
import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MarketplaceAppBar } from '@/components/marketplace/MarketplaceAppBar';
import { NFTCard } from '@/components/marketplace/NFTCard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFT {
  id: number;
  name: string;
  image: string;
  creator: string;
  description?: string;
  attributes?: NFTAttribute[];
  isListed: boolean;
  inCollection?: boolean;
  price?: number;
}

interface Collection {
  id: number;
  name: string;
  image: string;
  itemCount: number;
  nfts: NFT[];
}

const mockMyNFTs: NFT[] = [
  {
    id: 1,
    name: "My NFT #1",
    image: "/assets/images/nfts/nft1.png",
    creator: "You",
    description: "A unique digital collectible with special properties",
    attributes: [
      { trait_type: "Background", value: "Blue" },
      { trait_type: "Rarity", value: "Rare" }
    ],
    isListed: false,
    inCollection: false
  },
  {
    id: 2,
    name: "My NFT #2",
    image: "/assets/images/nfts/nft2.png",
    creator: "You",
    description: "Another amazing NFT with unique traits",
    attributes: [
      { trait_type: "Background", value: "Red" },
      { trait_type: "Rarity", value: "Common" }
    ],
    isListed: false,
    inCollection: true
  },
  // ... more NFTs
];

const mockListedNFTs = [
  {
    id: 1,
    name: "Listed NFT #1",
    image: "/assets/images/nfts/nft2.png",
    price: 1.5,
    creator: "You",
    isListed: true
  },
  // ... more listed NFTs
];

const mockCollections: Collection[] = [
  {
    id: 1,
    name: "Collection #1",
    image: "/assets/images/nfts/nft3.png",
    itemCount: 3,
    nfts: [
      {
        id: 1,
        name: "NFT #1",
        image: "/assets/images/nfts/nft1.png",
        creator: "You",
        description: "Part of Collection #1",
        isListed: false,
        inCollection: true
      },
      // Thêm NFTs khác
    ]
  }
];

const MyNFTs: FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'nfts' | 'listed' | 'collections'>('nfts');
  const [balance, setBalance] = useState<number>(0);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const getBalance = async () => {
      if (publicKey) {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      }
    };
    getBalance();
  }, [publicKey, connection]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const NFTDetailsModal = ({ nft, onClose }: { nft: NFT; onClose: () => void }) => {
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
            src={nft.image} 
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
              <p className="text-gray-300">{nft.creator}</p>
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

            {nft.isListed && (
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

  return (
    <div className="min-h-screen bg-default-900 select-none">
      <MarketplaceAppBar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Wallet Info Section */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">My Wallet</h2>
              {publicKey && (
                <>
                  <p className="text-gray-400">Address: {shortenAddress(publicKey.toString())}</p>
                  <p className="text-purple-500 font-bold mt-2">{balance.toFixed(2)} SOL</p>
                </>
              )}
            </div>
            <WalletMultiButton className="!bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          </div>
        </div>

        {publicKey ? (
          <>
            {/* Tabs */}
            <div className="flex space-x-4 mb-8">
              <button 
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'nfts' ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('nfts')}
              >
                My NFTs
              </button>
              <button 
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'listed' ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('listed')}
              >
                Listed NFTs
              </button>
              <button 
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'collections' ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('collections')}
              >
                Collections
              </button>
            </div>

            {/* My NFTs Tab */}
            {activeTab === 'nfts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockMyNFTs.map((nft) => (
                  <div key={nft.id} className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowModal(true);
                      }}
                    >
                      <img 
                        src={nft.image} 
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
                          onClick={() => console.log(`List NFT ${nft.id}`)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                        >
                          List for Sale
                        </button>
                        <button 
                          onClick={() => console.log(`Update metadata ${nft.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Update Metadata
                        </button>
                        {!nft.inCollection && (
                          <button 
                            onClick={() => console.log(`Add to collection ${nft.id}`)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                          >
                            Add to Collection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Listed NFTs Tab */}
            {activeTab === 'listed' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockListedNFTs.map((nft) => (
                  <div key={nft.id} className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowModal(true);
                      }}
                    >
                      <img 
                        src={nft.image} 
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
                      <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
                      <p className="text-purple-500 font-bold mt-2">{nft.price} SOL</p>
                      <div className="flex flex-col gap-2 mt-4">
                        <button 
                          onClick={() => console.log(`Update listing ${nft.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Update Listing
                        </button>
                        <button 
                          onClick={() => console.log(`Delist NFT ${nft.id}`)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                        >
                          Delist
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockCollections.map((collection) => (
                  <div 
                    key={collection.id} 
                    onClick={() => setSelectedCollection(collection)}
                    className="bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="relative group">
                      <img 
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                        <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          View Collection
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
                      <p className="text-gray-400 text-sm">{collection.itemCount} items</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect your wallet to view your NFTs</h2>
            <p className="text-gray-400">Connect your wallet to manage your NFT collection</p>
          </div>
        )}
      </div>

      {/* Collection Details Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedCollection.name}</h3>
                <p className="text-gray-400">{selectedCollection.itemCount} items</p>
              </div>
              <button 
                onClick={() => setSelectedCollection(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCollection.nfts.map((nft) => (
                <div 
                  key={nft.id}
                  className="bg-gray-700/50 rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
                >
                  <div className="relative group">
                    <img 
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setSelectedNFT(nft);
                          setShowModal(true);
                        }}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-medium">{nft.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedNFT && (
        <NFTDetailsModal 
          nft={selectedNFT} 
          onClose={() => {
            setShowModal(false);
            setSelectedNFT(null);
          }}
        />
      )}
    </div>
  );
};

export default MyNFTs;