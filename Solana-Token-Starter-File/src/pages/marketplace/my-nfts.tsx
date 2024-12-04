// src/pages/marketplace/my-nfts.tsx
import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { MarketplaceAppBar } from '@/components/marketplace/MarketplaceAppBar';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { useListedNFTs } from '@/hooks/useListedNFTs';
import PulseLoader from 'react-spinners/PulseLoader';
import Image from 'next/image';
import { notify } from '@/utils/notifications';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getMasterEdition, getMetadata } from '@/utils/accounts';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { getMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useRouter } from 'next/router';
import { delistNFT } from './delistNFT';
import { BN } from 'bn.js';
import { PROGRAM_ID } from '../../utils/Constants';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { IDL } from '@/idl/nft_marketplace'; // Đảm bảo import IDL
import { DelistNFTModal } from '@/components/modals/DelistNFTModal';

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
  collection_metadata?: any;
  properties?: {
    collection?: any;
    [key: string]: any;
  };
  totalItems?: number;
  floorPrice?: number;
}

// Thêm interface cho ListedNFT
interface ListedNFT {
  mint: PublicKey;
  price: number;
  metadata: {
    name: string;
    description?: string;
    image?: string;
  };
}

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

const listNFT = async (
  connection: Connection,
  provider: AnchorProvider,
  program: Program,
  nftMint: PublicKey,
  price: number,
): Promise<string> => {
  try {
    // Tạo listing PDA
    const [listingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), new PublicKey(nftMint).toBuffer()],
      PROGRAM_ID
    );

    // Lấy owner token account
    const ownerTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(nftMint),
      provider.wallet.publicKey
    );

    // Tạo escrow token account PDA
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [
        listingPDA.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        new PublicKey(nftMint).toBuffer()
      ],
      PROGRAM_ID
    );

    console.log('Listing NFT:', {
      mint: nftMint,
      listing: listingPDA.toBase58(),
      owner: provider.wallet.publicKey.toBase58(),
      escrow: escrowTokenAccount.toBase58(),
      price
    });

    // Gọi instruction list_nft
    const tx = await program.methods
      .listNft(new BN(price * LAMPORTS_PER_SOL))
      .accounts({
        owner: provider.wallet.publicKey,
        listingAccount: listingPDA,
        nftMint: new PublicKey(nftMint),
        ownerTokenAccount: ownerTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('NFT listed successfully. Signature:', tx);
    notify({ 
      type: 'success',
      message: 'NFT Listed Successfully',
      description: 'Your NFT has been listed on the marketplace'
    });

    return tx;

  } catch (error) {
    console.error('Error listing NFT:', error);
    notify({ 
      type: 'error',
      message: 'Error Listing NFT',
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};

// Hàm chuyển đổi từ ListedNFT sang NFT
const convertListedNFTtoNFT = (listedNFT: ListedNFT): NFT => {
  return {
    mint: listedNFT.mint.toString(),
    name: listedNFT.metadata.name,
    description: listedNFT.metadata.description,
    image: listedNFT.metadata.image,
    price: listedNFT.price
  };
};

// Thêm các hàm utility cho localStorage
const STORAGE_KEY_PREFIX = 'nft_marketplace_';

const getStorageKey = (publicKey: string, type: 'nfts' | 'listed' = 'nfts') => {
  return `${STORAGE_KEY_PREFIX}${type}_${publicKey}`;
};

const saveToLocalStorage = (publicKey: string, data: any, type: 'nfts' | 'listed' = 'nfts') => {
  if (!publicKey) return;
  const key = getStorageKey(publicKey, type);
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

const getFromLocalStorage = (publicKey: string, type: 'nfts' | 'listed' = 'nfts') => {
  if (!publicKey) return null;
  const key = getStorageKey(publicKey, type);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const clearAllCache = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

// Thêm component CollectionCard
const CollectionCard: FC<{ collection: NFT }> = ({ collection }) => {
  const router = useRouter();
  
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-purple-500/10 hover:border-purple-500/20 
      transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div className="relative aspect-square group">
        <img 
          src={collection.image || placeholderImage} 
          alt={collection.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 
          group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
            {collection.description && (
              <p className="text-sm text-gray-300 line-clamp-2">{collection.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Collection Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-500/10 rounded-lg p-3 text-center">
            <p className="text-sm text-purple-400">Total Items</p>
            <p className="text-xl font-bold text-white">
              {collection.totalItems || '0'}
            </p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-400">Floor Price</p>
            <p className="text-xl font-bold text-white">
              {collection.floorPrice ? `${collection.floorPrice} SOL` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => router.push(`/marketplace/collections/${collection.mint}`)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg
              hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold"
          >
            View Collection
          </button>
          
          <button 
            onClick={() => console.log(`Update ${collection.mint}`)}
            className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-3 
              rounded-lg transition-all duration-300 font-semibold border border-gray-600/30"
          >
            Update Metadata
          </button>
        </div>
      </div>
    </div>
  );
};

const MyNFTs: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program, provider } = useAnchorProgram();
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
  const [listingPrice, setListingPrice] = useState<string>('');
  const [listingDuration, setListingDuration] = useState<string>('7');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [isDelistModalOpen, setIsDelistModalOpen] = useState(false);
  const [selectedNFTForDelist, setSelectedNFTForDelist] = useState<NFT | null>(null);

  const { listings: listedNFTs, loading: listingsLoading, refresh: refreshListedNFTs } = useListedNFTs(publicKey || undefined);

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

  // Sửa lại hàm fetchNFTs
  const fetchNFTs = useCallback(async (forceRefresh = false) => {
    if (!publicKey || !program || isFetching) return;

    try {
      setIsFetching(true);
      setLoading(true);

      if (!forceRefresh) {
        const cachedData = getFromLocalStorage(publicKey.toString());
        if (cachedData?.data) {
          // Kiểm tra ownership cho các NFT trong cache
          const validNFTs = [];
          for (const nft of cachedData.data) {
            const isOwned = await checkNFTOwnership(nft.mint);
            if (isOwned) {
              validNFTs.push(nft);
            }
          }
          saveToLocalStorage(publicKey.toString(), validNFTs);
          setNfts(validNFTs);
          setLoading(false);
          return;
        }
      }

      // Fetch dữ liệu mới từ chain
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
          if (!mintInfo.isInitialized || mintInfo.decimals !== 0) {
            continue;
          }

          const metadataPDA = await getMetadata(mintPubkey);
          const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
          const masterEditionPDA = await getMasterEdition(mintPubkey);
          const masterEditionAccount = await connection.getAccountInfo(masterEditionPDA);

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

              const isCollection = Boolean(
                metadata.collectionDetails?.__kind === 'V1' &&
                masterEditionAccount !== null &&
                !metadata.collection
              );

              console.log("NFT check:", {
                name: nft.name,
                isCollection,
                collectionDetails: metadata.collectionDetails,
                hasMasterEdition: masterEditionAccount !== null,
                hasCollection: metadata.collection
              });

              if (isCollection) {
                console.log("Found collection:", nft.name);
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

      console.log(`Tìm thấy ${userCollections.length} collections và ${userNFTs.length} NFTs`);
      setNfts(userNFTs);
      setCollections(userCollections);

      // Lọc và lưu chỉ những NFT còn sở hữu
      const ownedNFTs = userNFTs.filter(async (nft) => {
        return await checkNFTOwnership(nft.mint);
      });

      saveToLocalStorage(publicKey.toString(), ownedNFTs);
      setNfts(ownedNFTs);

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

  // Thêm effect để clear cache khi đổi ví
  useEffect(() => {
    if (publicKey) {
      const lastWallet = localStorage.getItem(`${STORAGE_KEY_PREFIX}last_wallet`);
      if (lastWallet !== publicKey.toString()) {
        clearAllCache();
        localStorage.setItem(`${STORAGE_KEY_PREFIX}last_wallet`, publicKey.toString());
      }
    }
  }, [publicKey]);

  // Thêm hàm clear cache
  const clearNFTCache = useCallback(() => {
    if (publicKey) {
      localStorage.removeItem(`nfts_${publicKey.toString()}`);
    }
  }, [publicKey]);

  // Sửa lại hàm refreshData để clear cache trước khi fetch
  const refreshData = useCallback(async () => {
    if (!publicKey || !program) return;
    try {
      clearNFTCache(); // Clear cache trước khi refresh
      await fetchNFTs();
      notify({ 
        type: 'success',
        message: 'NFTs refreshed successfully!'
      });
    } catch (error) {
      console.error('Error refreshing NFTs:', error);
      notify({ 
        type: 'error',
        message: 'Failed to refresh NFTs',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [publicKey, program, fetchNFTs, clearNFTCache]);

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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full mx-auto overflow-hidden border border-purple-500/20">
          <div className="flex flex-col md:flex-row">
            {/* Phần hình ảnh */}
            <div className="md:w-1/2 relative">
              <div className="aspect-square">
                <img 
                  src={nft.image || placeholderImage}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Phần thông tin */}
            <div className="md:w-1/2 p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-white">{nft.name}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Symbol */}
              {nft.symbol && (
                <div className="bg-purple-500/10 rounded-lg p-3">
                  <p className="text-purple-400 text-sm">Symbol</p>
                  <p className="text-white font-medium">{nft.symbol}</p>
                </div>
              )}

              {/* Description */}
              {nft.description && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Description</h4>
                  <p className="text-white leading-relaxed">{nft.description}</p>
                </div>
              )}

              {/* Creators */}
              {nft.creators && nft.creators.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Creators</h4>
                  <div className="space-y-2">
                    {nft.creators.map((creator, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{shortenAddress(creator.address)}</span>
                          {creator.verified && (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-purple-400">{creator.share}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {nft.attributes && nft.attributes.length > 0 && (
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {nft.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-purple-400 text-sm">{attr.trait_type}</p>
                        <p className="text-white font-medium truncate">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection */}
              {nft.collection && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-gray-400 text-sm mb-2">Collection</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{shortenAddress(nft.collection.address)}</span>
                    {nft.collection.verified && (
                      <span className="bg-green-500/20 text-green-400 text-sm px-3 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mint Address */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-gray-400 text-sm mb-2">Mint Address</h4>
                <p className="text-white font-medium break-all">{nft.mint}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    onClose();
                    setSelectedNFT(nft);
                    setShowListingModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl
                    hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  List for Sale
                </button>
                <button
                  onClick={() => {/* Add update metadata logic */}}
                  className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-500/50 px-4 py-3 rounded-xl
                    hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  Update Metadata
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CollectionDetailsModal = ({ collection, onClose }: { collection: NFT; onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [localCollectionNFTs, setLocalCollectionNFTs] = useState<NFT[]>([]);
    
    // Chỉ chạy một lần khi component mount và khi collection thay ổi
    useEffect(() => {
      const filterNFTs = () => {
        setLoading(true);
        try {
          const filteredNFTs = nfts.filter(nft => 
            nft.collection?.address === collection.mint
          );
          setLocalCollectionNFTs(filteredNFTs);
        } catch (error) {
          console.error('Error filtering collection NFTs:', error);
        } finally {
          setLoading(false);
        }
      };

      filterNFTs();
    }, [collection.mint, nfts]); // Chỉ phụ thuộc vào collection.mint và nfts

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

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <PulseLoader color="#9333ea" />
            </div>
          ) : localCollectionNFTs.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No NFTs found in this collection
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {localCollectionNFTs.map((nft) => (
                <div 
                  key={nft.mint}
                  className="bg-gray-700/50 rounded-lg overflow-hidden"
                >
                  <img 
                    src={nft.image || placeholderImage}
                    alt={nft.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="text-white font-medium">{nft.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ListNFTModal = ({ nft, onClose }: { nft: NFT; onClose: () => void }) => {
    const [listingPrice, setListingPrice] = useState<string>('');
    const [listingDuration, setListingDuration] = useState<string>('7');
    const [isProcessing, setIsProcessing] = useState(false);
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const { program } = useAnchorProgram();

    const handleListNFT = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!publicKey || !program || !selectedNFT || !listingPrice) return;

      try {
        setIsProcessing(true);
        const nftMintPubkey = new PublicKey(selectedNFT.mint);
        const price = parseFloat(listingPrice);
        const duration = parseInt(listingDuration);
        
        // Tạo PDA cho listing account
        const [listingPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("listing"), nftMintPubkey.toBuffer()],
          program.programId
        );

        // Tạo PDA cho nft_token account
        const nftTokenPDA = getAssociatedTokenAddressSync(
          nftMintPubkey,
          publicKey
        );

        // Tạo PDA cho escrow token account
        const escrowTokenAccount = getAssociatedTokenAddressSync(
          nftMintPubkey,
          listingPDA,
          true
        );

        // Lấy marketplace config PDA
        const [marketplaceConfig] = PublicKey.findProgramAddressSync(
          [Buffer.from("marketplace")],
          program.programId
        );

        const tx = await program.methods
          .listNft(new BN(price * LAMPORTS_PER_SOL), new BN(duration))
          .accounts({
            owner: publicKey,
            listingAccount: listingPDA,
            nftMint: nftMintPubkey,
            nftToken: nftTokenPDA,
            escrowTokenAccount,
            marketplaceConfig,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        await connection.confirmTransaction(tx);

        notify({ 
          type: 'success',
          message: 'NFT listed successfully!',
          txid: tx
        });

        // Đợi một chút để blockchain update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh listed NFTs và chuyển tab
        await refreshListedNFTs();
        setActiveTab('listed');

      } catch (error) {
        console.error("Error listing NFT:", error);
        notify({
          type: 'error',
          message: 'Failed to list NFT',
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setIsProcessing(false);
        setShowListingModal(false);
        setSelectedNFT(null);
        setListingPrice('');
        setListingDuration('7');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">List NFT</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá (SOL)
            </label>
            <input
              type="number"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời hạn (ngày)
            </label>
            <input
              type="number"
              value={listingDuration}
              onChange={(e) => setListingDuration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="1"
              max="30"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowListingModal(false);
                setSelectedNFT(null);
                setListingPrice('');
                setListingDuration('7');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
            <button
              onClick={handleListNFT}
              disabled={isProcessing || !listingPrice}
              className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors ${
                isProcessing || !listingPrice ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Đang xử lý...' : 'List NFT'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ListingModal = ({ nft, onClose }: { nft: NFT; onClose: () => void }) => {
    const [listingPrice, setListingPrice] = useState<number>(0);
    const [isListing, setIsListing] = useState(false);
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const { program, provider } = useAnchorProgram();

    const handleListing = async () => {
      if (!nft || listingPrice <= 0 || !publicKey || !program) {
        notify({
          type: 'error',
          message: 'Invalid Parameters',
          description: 'Please check all parameters are valid'
        });
        return;
      }

      try {
        setIsListing(true);

        // Tạo listing PDA
        const [listingPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('listing'), new PublicKey(nft.mint).toBuffer()],
          program.programId
        );

        // Lấy owner token account
        const ownerTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(nft.mint),
          publicKey
        );

        // Tạo escrow token account PDA
        const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('escrow'),
            listingPDA.toBuffer(),
            new PublicKey(nft.mint).toBuffer()
          ],
          program.programId
        );

        console.log('Listing NFT:', {
          mint: nft.mint,
          listing: listingPDA.toBase58(),
          owner: publicKey.toBase58(),
          escrow: escrowTokenAccount.toBase58(),
          price: listingPrice
        });

        const tx = await program.methods
          .listNft(new BN(listingPrice * LAMPORTS_PER_SOL))
          .accounts({
            listing: listingPDA,
            owner: publicKey,
            nftMint: new PublicKey(nft.mint),
            ownerNftAccount: ownerTokenAccount,
            escrowNftAccount: escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        notify({
          type: 'success',
          message: 'NFT Listed Successfully',
          description: `Transaction: ${tx}`
        });

        onClose();
        
      } catch (error) {
        console.error('Error listing NFT:', error);
        notify({
          type: 'error',
          message: 'Error Listing NFT',
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        setIsListing(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-white">List NFT for Sale</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Price (SOL)</label>
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                placeholder="Enter price in SOL"
                min="0"
                step="0.1"
              />
            </div>

            <button
              onClick={handleListing}
              disabled={isListing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isListing ? 'Processing...' : 'List NFT'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenDelistModal = (listedNFT: ListedNFT) => {
    const nft = convertListedNFTtoNFT(listedNFT);
    setSelectedNFTForDelist(nft);
    setIsDelistModalOpen(true);
  };

  const handleConfirmDelist = async () => {
    if (!selectedNFTForDelist || !publicKey || !provider) return;
    
    try {
      setLoading(true);
      await delistNFT(
        connection,
        provider,
        program.programId,
        new PublicKey(selectedNFTForDelist.mint)
      );

      // Đợi một chút để blockchain update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cập nhật cache và state
      const cachedListedNFTs = getFromLocalStorage(publicKey.toString(), 'listed')?.data || [];
      const updatedListedNFTs = cachedListedNFTs.filter(
        (nft: NFT) => nft.mint !== selectedNFTForDelist.mint
      );
      saveToLocalStorage(publicKey.toString(), updatedListedNFTs, 'listed');

      // Kiểm tra xem NFT còn thuộc về ví không
      const tokenAccount = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(selectedNFTForDelist.mint) }
      );

      // Nếu còn sở hữu NFT, thêm vào my NFTs
      if (tokenAccount.value.length > 0) {
        const cachedNFTs = getFromLocalStorage(publicKey.toString())?.data || [];
        const updatedNFTs = [...cachedNFTs, selectedNFTForDelist];
        saveToLocalStorage(publicKey.toString(), updatedNFTs);
        setNfts(updatedNFTs);
      }

      // Refresh cả hai danh sách
      await refreshListedNFTs();
      await fetchNFTs(true); // Force refresh từ chain
      
      setActiveTab('nfts');
      setIsDelistModalOpen(false);
      
      notify({ 
        type: 'success',
        message: 'NFT delisted successfully!'
      });

    } catch (error) {
      console.error('Error delisting NFT:', error);
      notify({
        type: 'error',
        message: 'Error delisting NFT',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
      setSelectedNFTForDelist(null);
    }
  };

  // Thêm hàm kiểm tra ownership
  const checkNFTOwnership = async (mintAddress: string): Promise<boolean> => {
    if (!publicKey) return false;

    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(mintAddress) }
      );
      return tokenAccounts.value.length > 0;
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return false;
    }
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchNFTs(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </>
                )}
              </button>
              <WalletMultiButton className="!bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
            </div>
          </div>
        </div>

        {publicKey ? (
          <>
            {/* Tabs Container */}
            <div className="bg-gray-800/30 p-2 rounded-xl mb-8">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('nfts')}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 
                    ${activeTab === 'nfts'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>My NFTs</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('listed')}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300
                    ${activeTab === 'listed'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Listed NFTs</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('collections')}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300
                    ${activeTab === 'collections'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Collections</span>
                  </div>
                </button>
              </div>
            </div>

            {/* My NFTs Tab */}
            {activeTab === 'nfts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                  <div key={nft.mint} 
                    className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden 
                      transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl 
                      border border-purple-500/10 hover:border-purple-500/20"
                  >
                    {/* Image Container */}
                    <div 
                      className="relative aspect-square cursor-pointer group"
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowModal(true);
                      }}
                    >
                      <img 
                        src={nft.image || placeholderImage} 
                        alt={nft.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                        <div className="text-white">
                          <p className="font-semibold">{nft.name}</p>
                          {nft.symbol && (
                            <p className="text-sm text-gray-300">{nft.symbol}</p>
                          )}
                        </div>
                        <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Content Container */}
                    <div className="p-4 space-y-4">
                      {/* NFT Info */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white truncate">{nft.name}</h3>
                        {nft.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{nft.description}</p>
                        )}
                      </div>

                      {/* Collection Badge - if part of collection */}
                      {nft.collection && (
                        <div className="flex items-center space-x-2 bg-purple-500/10 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="text-sm text-purple-400">Collection</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNFT(nft);
                            setShowListingModal(true);
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg
                            hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>List for Sale</span>
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(`Update metadata ${nft.mint}`);
                          }}
                          className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-lg
                            transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-600/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Update Metadata</span>
                        </button>

                        {!nft.collection && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Add to collection ${nft.mint}`);
                            }}
                            className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-lg
                              transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-600/30"
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
                    <div key={nft.mint.toString()} className="bg-gray-800/50 rounded-xl overflow-hidden">
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
                            onClick={() => handleOpenDelistModal(nft)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            disabled={loading}
                          >
                            {loading ? 'Processing...' : 'Delist'}
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
              <div className="space-y-8">
                {/* Collections Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Collections</h2>
                  <button
                    onClick={() => router.push('/marketplace/create-collection')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg 
                      flex items-center gap-2 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Collection
                  </button>
                </div>

                {/* Collections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {collections.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-xl">
                      <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-xl text-gray-400 mb-2">No Collections Found</p>
                      <p className="text-gray-500 text-center max-w-md">
                        Create your first collection to organize and showcase your NFTs
                      </p>
                    </div>
                  ) : (
                    collections.map((collection) => (
                      <CollectionCard key={collection.mint} collection={collection} />
                    ))
                  )}
                </div>
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

      {/* Keep existing modals */}
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
      {selectedNFT && showListingModal && (
        <ListNFTModal 
          nft={selectedNFT}
          onClose={() => {
            setShowListingModal(false);
            setSelectedNFT(null);
            setListingPrice('');
            setListingDuration('7');
          }}
        />
      )}
      <DelistNFTModal
        isOpen={isDelistModalOpen}
        onClose={() => setIsDelistModalOpen(false)}
        nft={selectedNFTForDelist}
        onConfirm={handleConfirmDelist}
        loading={loading}
      />
    </div>
  );
};

export default MyNFTs;