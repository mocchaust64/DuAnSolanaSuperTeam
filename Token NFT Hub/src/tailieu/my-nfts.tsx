// src/pages/marketplace/my-nfts.tsx
import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { MarketplaceAppBar } from '@/components/marketplace/MarketplaceAppBar';
import { NFTCard } from '@/components/marketplace/NFTCard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, Signer } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { NftMarketplace } from '@/utils/idlNFT';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { notify } from '@/utils/notifications';
import { getMetadata } from '@/utils/accounts';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { Metadata, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useRouter } from 'next/router';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { IDL } from "@/utils/idlNFT";

interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
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
}

interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

const isBrowser = typeof window !== 'undefined';
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%239CA3AF' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
const PROGRAM_ID = new PublicKey("CFSd2NBvuNZY16M3jcYZufyZbhdok4esET8N2kyEdVrs");
const NETWORK = "devnet";
const SOLANA_RPC = "https://api.devnet.solana.com";

export const MyNFT: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useAnchorProgram();
  const router = useRouter();

  // Basic states
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [nftMetadata, setNftMetadata] = useState<{[key: string]: NFTMetadata}>({});

  // Modal states
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
const [listingDuration, setListingDuration] = useState('7');
  const [isProcessing, setIsProcessing] = useState(false);

  // Thêm state để quản lý tab
  const [activeTab, setActiveTab] = useState<'my-nfts' | 'listed-nfts' | 'collections'>('my-nfts');

  const fetchNFTMetadata = async (uri: string): Promise<NFTMetadata | null> => {
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
              userNFTs.push({
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
                } : undefined
              });
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

  const handleListing = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsListingModalOpen(true);
  };

  const handleListNFT = async (nft: NFT, price: number, listingDuration: number) => {
    if (!publicKey || !program) return;

    try {
      setIsProcessing(true);
      const nftMintPubkey = new PublicKey(nft.mint);
      
      console.log("Listing NFT with details:", {
        mint: nft.mint,
        price,
        duration: listingDuration,
        owner: publicKey.toBase58()
      });

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

      console.log("Listing accounts:", {
        listingPDA: listingPDA.toBase58(),
        nftTokenPDA: nftTokenPDA.toBase58(),
        escrowTokenAccount: escrowTokenAccount.toBase58(),
        marketplaceConfig: marketplaceConfig.toBase58()
      });

      const tx = await program.methods
        .listNft(new BN(price * LAMPORTS_PER_SOL), new BN(listingDuration))
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

      notify({ 
        type: 'success',
        message: 'NFT listed successfully!',
        txid: tx
      });

      // Đợi transaction được confirm
      await connection.confirmTransaction(tx);

      // Chuyển hướng sang trang NFT Listed
      router.push('/marketplace/listed-nfts');

    } catch (error) {
      console.error("Error listing NFT:", error);
      notify({
        type: 'error',
        message: 'Failed to list NFT',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
      setIsListingModalOpen(false);
      setSelectedNFT(null);
      setListingPrice('');
}
  };

  useEffect(() => {
    if (publicKey && !isFetching) {
      fetchNFTs();
    }
  }, [publicKey, fetchNFTs]);

  // Refresh function
  const refreshData = useCallback(async () => {
    if (!publicKey || !program) return;
    try {
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
  }, [publicKey, program, fetchNFTs]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Phần tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('my-nfts')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 ${
              activeTab === 'my-nfts'
                ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            My NFTs
          </button>
          
          <button
            onClick={() => router.push('/marketplace/listed-nfts')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 ${
              activeTab === 'listed-nfts'
                ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Listed NFTs
          </button>
          
          <button
            onClick={() => router.push('/marketplace/collections')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 ${
              activeTab === 'collections'
                ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Collections
          </button>
        </div>
      </div>

      {/* Phần nội dung */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My NFTs</h1>
          <button
            onClick={refreshData}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Refresh NFTs
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy NFT trong ví của bạn</p>
          </div>
        ) : (
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <div key={nft.mint} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={nft.image || placeholderImage}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                  {nft.symbol && (
                    <p className="text-sm text-gray-500 mb-2">Symbol: {nft.symbol}</p>
                  )}
                  <button
                    onClick={() => handleListing(nft)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Đang xử lý...' : 'List NFT'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal listing NFT */}
        {selectedNFT && isListingModalOpen && (
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
                    setIsListingModalOpen(false);
                    setSelectedNFT(null);
                    setListingPrice('');
                  }}
className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleListNFT(selectedNFT, parseFloat(listingPrice), parseInt(listingDuration))}
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
        )}
      </div>
    </div>
  );
};

export default MyNFT;