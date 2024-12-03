// src/pages/marketplace/my-nfts.tsx
import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { MarketplaceAppBar } from '@/components/marketplace/MarketplaceAppBar';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useListedNFTs } from '@/hooks/useListedNFTs';
import PulseLoader from 'react-spinners/PulseLoader';
import Image from 'next/image';
import { notify } from '@/utils/notifications';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getMetadata } from '@/utils/accounts';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useRouter } from 'next/router';

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFT {
  mint: string;
  name?: string;
  symbol?: string;
  uri?: string;
  image?: string;
  description?: string;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  collection?: {
    verified: boolean;
    address: string;
  };
  attributes?: NFTAttribute[];
  price?: number;
}

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

const MyNFTs: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useAnchorProgram();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'nfts' | 'listed' | 'collections'>('nfts');
  const [balance, setBalance] = useState<number>(0);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<NFT | null>(null);
  const [collectionNFTs, setCollectionNFTs] = useState<NFT[]>([]);

  const { listings: listedNFTs, loading: listingsLoading } = useListedNFTs(publicKey || undefined);

  useEffect(() => {
    const getBalance = async () => {
      if (publicKey) {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      }
    };
    getBalance();
  }, [publicKey, connection]);

  const fetchNFTMetadata = async (uri: string): Promise<NFT | null> => {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  };

  const fetchNFTs = useCallback(async () => {
    if (!publicKey || !program || isFetching) return;
  
    try {
      setIsFetching(true);
      setLoading(true);
      console.log("Bắt đầu tìm NFTs cho ví:", publicKey.toBase58());
  
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
  
      console.log(`Tìm thấy ${tokenAccounts.value.length} token accounts`);
  
      const userNFTs: NFT[] = [];
      const userCollections: NFT[] = [];
  
      for (const tokenAccount of tokenAccounts.value) {
        try {
          const mintAddress = tokenAccount.account.data.parsed.info.mint;
          const mintPubkey = new PublicKey(mintAddress);
          const amount = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
  
          if (amount !== 1) continue;
  
          const mintInfo = await getMint(connection, mintPubkey);
          if (!mintInfo.isInitialized || mintInfo.decimals !== 0 || mintInfo.supply !== BigInt(1)) {
            continue;
          }
  
          const metadataPDA = await getMetadata(mintPubkey);
          const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
  
          try {
            const nftMetadata = await fetchNFTMetadata(metadata.data.uri.replace(/\0/g, ''));
            
            if (nftMetadata) {
              const nft = {
                mint: mintAddress,
                name: metadata.data.name.replace(/\0/g, ''),
                symbol: metadata.data.symbol.replace(/\0/g, ''),
                uri: metadata.data.uri.replace(/\0/g, ''),
                image: nftMetadata.image,
                description: nftMetadata.description,
                creators: metadata.data.creators?.map(creator => ({
                  address: creator.address.toBase58(),
                  verified: creator.verified,
                  share: creator.share
                })),
                collection: metadata.collection ? {
                  verified: metadata.collection.verified,
                  address: metadata.collection.key.toBase58()
                } : undefined,
                attributes: nftMetadata.attributes,
                price: nftMetadata.price
              };
  
              // Kiểm tra điều kiện collection
              if (metadata.collectionDetails?.__kind === 'V1') {
                userCollections.push(nft);
              } else {
                userNFTs.push(nft);
              }
            }
          } catch (error) {
            console.error("Error fetching NFT metadata:", error);
          }
        } catch (err) {
          console.error("Error processing token account:", err);
          continue;
        }
      }
  
      setNfts(userNFTs);
      setCollections(userCollections);
  
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      notify({
        type: 'error',
        message: 'Error loading NFTs',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [connection, publicKey, program]);

  useEffect(() => {
    if (publicKey && !isFetching) {
      fetchNFTs();
    }
  }, [publicKey, fetchNFTs]);

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

  const CollectionDetailsModal = ({ collection, onClose }: { collection: NFT; onClose: () => void }) => {
    useEffect(() => {
      const fetchCollectionNFTs = async () => {
        if (!collection) return;
  
        try {
          setLoading(true);
          const response = await fetch(collection.uri);
          const metadata = await response.json();
          setCollectionNFTs(metadata.nfts || []);
        } catch (error) {
          console.error('Error fetching collection NFTs:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchCollectionNFTs();
    }, [collection]);
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">{collection.name}</h3>
              <p className="text-gray-400">{collection.description}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collectionNFTs.map((nft) => (
              <div 
                key={nft.mint}
                className="bg-gray-700/50 rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
              >
                <div className="relative group">
                  <img 
                    src={nft.image || placeholderImage}
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
                {nfts.map((nft) => (
                  <div key={nft.mint} className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowModal(true);
                      }}
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
                          onClick={() => console.log(`List NFT ${nft.mint}`)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                        >
                          List for Sale
                        </button>
                        <button 
                          onClick={() => console.log(`Update metadata ${nft.mint}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Update Metadata
                        </button>
                        {!nft.collection && (
                          <button 
                            onClick={() => console.log(`Add to collection ${nft.mint}`)}
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
                {listingsLoading ? (
                  <div className="col-span-full flex justify-center items-center h-64">
                    <PulseLoader color="#9333ea" />
                  </div>
                ) : listedNFTs.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400">
                    No NFTs currently listed
                  </div>
                ) : (
                  listedNFTs.map((nft) => (
                    <div key={nft.mint.toString()} className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <div className="relative group cursor-pointer">
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
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                          <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            View Details
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white">{nft.metadata.name}</h3>
                        <p className="text-purple-500 font-bold mt-2">{nft.price} SOL</p>
                        <div className="flex flex-col gap-2 mt-4">
                          <button 
                            onClick={() => console.log(`Update listing ${nft.mint.toString()}`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            Update Listing
                          </button>
                          <button 
                            onClick={() => console.log(`Delist NFT ${nft.mint.toString()}`)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          >
                            Delist
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {collections.map((collection) => (
                  <div key={collection.mint} className="bg-gray-800/50 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedCollection(collection);
                      }}
                    >
                      <img 
                        src={collection.image || placeholderImage} 
                        alt={collection.name} 
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                        <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          View Details
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => console.log(`List Collection ${collection.mint}`)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                        >
                          List for Sale
                        </button>
                        <button 
                          onClick={() => console.log(`Update metadata ${collection.mint}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Update Metadata
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCollection && (
              <CollectionDetailsModal 
                collection={selectedCollection} 
                onClose={() => setSelectedCollection(null)}
              />
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect your wallet to view your NFTs</h2>
            <p className="text-gray-400">Connect your wallet to manage your NFT collection</p>
          </div>
        )}
      </div>

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
      {showModal && selectedCollection && (
        <CollectionDetailsModal 
          collection={selectedCollection} 
          onClose={() => {
            setShowModal(false);
            setSelectedCollection(null);
          }}
        />
      )}
    </div>
  );
};

export default MyNFTs;