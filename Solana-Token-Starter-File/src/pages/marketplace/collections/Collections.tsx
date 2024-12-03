import { FC, useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Metadata, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Interfaces
interface Collection {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  creators: Creator[];
  verified: boolean;
  totalItems: number;
}

interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

// Thêm helper function để kiểm tra môi trường
const isBrowser = typeof window !== 'undefined';

export const Collections: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedCollections, setHasLoadedCollections] = useState(() => {
    if (isBrowser) {
      return localStorage.getItem('user_collections_loaded') === 'true';
    }
    return false;
  });
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchCollections = useCallback(async (forceRefresh = false) => {
    if (!publicKey || loading) return;

    try {
      setLoading(true);
      console.log("Bắt đầu tìm Collections...");

      // Kiểm tra cache
      if (!forceRefresh && isBrowser) {
        const cachedCollections = localStorage.getItem(`user_collections_${publicKey.toBase58()}`);
        if (cachedCollections && hasLoadedCollections) {
          console.log("Đọc Collections từ cache");
          setCollections(JSON.parse(cachedCollections));
          setLoading(false);
          return;
        }
      }

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      console.log(`Tìm thấy ${tokenAccounts.value.length} token accounts`);

      const userCollections: Collection[] = [];
      const processedMints = new Set<string>();

      for (const tokenAccount of tokenAccounts.value) {
        try {
          const mintAddress = tokenAccount.account.data.parsed.info.mint;
          
          // Skip if already processed
          if (processedMints.has(mintAddress)) continue;
          processedMints.add(mintAddress);

          const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              new PublicKey(mintAddress).toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
          );

          const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
          
          // Chỉ lấy NFT collection
          const isCollection = metadata.collectionDetails?.__kind === 'V1';
          if (!isCollection) continue;

          console.log("Processing Collection:", metadata.data.name);
          
          // Fetch metadata từ URI
          const response = await fetch(metadata.data.uri.replace(/\0/g, ''));
          const nftMetadata: NFTMetadata = await response.json();
          
          userCollections.push({
            mint: mintAddress,
            name: metadata.data.name.replace(/\0/g, ''),
            symbol: metadata.data.symbol.replace(/\0/g, ''),
            uri: metadata.data.uri.replace(/\0/g, ''),
            image: nftMetadata.image,
            creators: metadata.data.creators?.map(creator => ({
              address: creator.address.toBase58(),
              verified: creator.verified,
              share: creator.share
            })) || [],
            verified: metadata.collection?.verified || false,
            totalItems: 0 // TODO: Implement counting total items
          });

        } catch (err) {
          console.error("Error processing token account:", err);
          continue;
        }
      }

      console.log("Found Collections:", userCollections);
      
      // Lưu vào cache
      if (isBrowser) {
        localStorage.setItem(`user_collections_${publicKey.toBase58()}`, JSON.stringify(userCollections));
        localStorage.setItem('user_collections_loaded', 'true');
      }
      
      setHasLoadedCollections(true);
      setCollections(userCollections);

    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, loading, hasLoadedCollections]);

  // Clear cache khi wallet thay đổi
  useEffect(() => {
    if (!publicKey) {
      if (isBrowser) {
        localStorage.removeItem('user_collections_loaded');
      }
      setHasLoadedCollections(false);
      setCollections([]);
    }
  }, [publicKey]);

  // Thêm vào phần useEffect
  useEffect(() => {
    if (publicKey && isBrowser) {
      // Load từ localStorage trước
      const cachedCollections = localStorage.getItem(`user_collections_${publicKey.toBase58()}`);
      if (cachedCollections && hasLoadedCollections) {
        console.log("Đọc Collections từ cache khi khởi tạo");
        setCollections(JSON.parse(cachedCollections));
      }
    }
  }, [publicKey]); // Chỉ chạy khi publicKey thay đổi

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">My Collections</h2>
        
        <button 
          onClick={() => fetchCollections(true)} // Thêm true để force refresh
          disabled={loading || !publicKey}
          className={`px-4 py-2 rounded-md font-semibold flex items-center gap-2 ${
            loading || !publicKey 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh from Blockchain</span>
            </>
          )}
        </button>
      </div>

      {!publicKey ? (
        <p className="text-gray-400 text-center">Please connect your wallet to view your collections</p>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"/>
          <p className="text-gray-400">Loading collections...</p>
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div 
              key={collection.mint} 
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                setSelectedCollection(collection);
                setIsDetailModalOpen(true);
              }}
            >
              <div className="relative aspect-square w-full mb-4">
                <img 
                  src={collection.image || placeholderImage}
                  alt={collection.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== placeholderImage) {
                      target.src = placeholderImage;
                    }
                  }}
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{collection.name}</h3>
              <p className="text-gray-400 mb-2">{collection.symbol}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  collection.verified ? 'bg-green-600' : 'bg-yellow-600'
                }`}>
                  {collection.verified ? 'Verified' : 'Unverified'}
                </span>
                <span className="text-gray-400">{collection.totalItems} items</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center">No collections found</p>
      )}

      {/* Collection Detail Modal */}
      {isDetailModalOpen && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-white">{selectedCollection.name}</h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="aspect-square w-full">
                <img 
                  src={selectedCollection.image || placeholderImage}
                  alt={selectedCollection.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== placeholderImage) {
                      target.src = placeholderImage;
                    }
                  }}
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Symbol</h4>
                  <p className="text-white">{selectedCollection.symbol}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400">Mint Address</h4>
                  <p className="text-white break-all">{selectedCollection.mint}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400">Status</h4>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    selectedCollection.verified ? 'bg-green-600' : 'bg-yellow-600'
                  }`}>
                    {selectedCollection.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400">Total Items</h4>
                  <p className="text-white">{selectedCollection.totalItems}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400">Creators</h4>
                  <div className="space-y-2">
                    {selectedCollection.creators.map((creator, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-white break-all">{creator.address}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{creator.share}%</span>
                          {creator.verified && (
                            <span className="text-green-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <a
                    href={`https://explorer.solana.com/address/${selectedCollection.mint}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold text-white transition-colors"
                  >
                    View on Explorer ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};