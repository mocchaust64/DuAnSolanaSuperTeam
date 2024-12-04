import { FC, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Connection,
  ComputeBudgetProgram,
  TransactionMessage,
  Commitment
} from '@solana/web3.js';

import{MarketplaceAppBar} from "../MarketplaceAppBar"
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { useAnchorProgram } from '../../../hooks/useAnchorProgram';
import { notify } from '../../../utils/notifications';
import { TOKEN_METADATA_PROGRAM_ID } from '../../../utils/Constants';
import { getMetadata, getMasterEdition } from '../../../utils/accounts';
import { uploadImageToIPFS, uploadNFTMetadata } from '../../../utils/pinataUploader';
import { Keypair } from '@solana/web3.js';
import { useRouter } from 'next/router';
import NotificationList from '@/components/Notification';

interface CollectionFormData {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  sellerFeeBasisPoints: number;
}

interface Creator {
  address: PublicKey;
  verified: boolean;
  share: number;
}

interface NFTMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: {
    address: PublicKey;
    verified: boolean;
    share: number;
  }[];
}

interface NFTMetadataProperties {
  files: Array<{
    uri: string;
    type: string;
  }>;
  category: string;
  creators: Array<{
    address: string;
    share: number;
  }>;
}

interface PinataMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<any>;
  properties: NFTMetadataProperties;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export const CreateCollection: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { program } = useAnchorProgram();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null as File | null,
    sellerFeeBasisPoints: 0
  });
  const [collectionMintAddress, setCollectionMintAddress] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));

    if (name === 'image' && 'files' in e.target) {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      setFormData(prev => ({ ...prev, image: file }));
    } 
    else if (name === 'sellerFeeBasisPoints') {
      const percentage = parseFloat(value) || 0;
      if (percentage >= 0 && percentage <= 100) {
        const basisPoints = Math.round(percentage * 100);
        setFormData(prev => ({ 
          ...prev, 
          sellerFeeBasisPoints: basisPoints 
        }));
      }
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCollection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.name || !formData.symbol || !formData.description || !formData.image) {
        notify({ 
          type: 'error',
          message: 'Please fill all required fields'
        });
        return;
      }

      const imageUrl = await uploadImageToIPFS(formData.image, formData.name);
      const pinataMetadata: PinataMetadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: imageUrl,
        attributes: [],
        properties: {
          files: [{ uri: imageUrl, type: "image/png" }],
          category: "image",
          creators: [{
            address: publicKey.toString(),
            share: 100
          }]
        }
      };

      const metadataUrl = await uploadNFTMetadata(pinataMetadata);
      const collectionMint = Keypair.generate();
      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        program.programId
      );

      const metadataPDA = await getMetadata(collectionMint.publicKey);
      const masterEdition = await getMasterEdition(collectionMint.publicKey);
      const destination = await getAssociatedTokenAddress(
        collectionMint.publicKey,
        publicKey
      );

      const createCollectionTx = new Transaction();
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000
      });
      createCollectionTx.add(modifyComputeUnits);

      const createCollectionIx = await program.methods
        .createCollection({
          name: formData.name,
          symbol: formData.symbol,
          uri: metadataUrl,
          sellerFeeBasisPoints: formData.sellerFeeBasisPoints,
          creators: [{
            address: publicKey,
            verified: false,
            share: 100
          }]
        })
        .accounts({
          user: publicKey,
          mint: collectionMint.publicKey,
          mintAuthority,
          metadata: metadataPDA,
          masterEdition,
          destination,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY
        })
        .instruction();

      createCollectionTx.add(createCollectionIx);

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      createCollectionTx.recentBlockhash = latestBlockhash.blockhash;
      createCollectionTx.feePayer = publicKey;

      try {
        createCollectionTx.partialSign(collectionMint);
        const signedTx = await signTransaction(createCollectionTx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });

        setCollectionMintAddress(collectionMint.publicKey.toString());
        
        notify({ 
          type: 'success',
          message: 'Collection created successfully!',
          description: 'Your collection has been created.',
          txid: signature 
        });

      } catch (error) {
        console.error('Error in transaction:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error creating collection:', error);
      notify({ 
        type: 'error',
        message: 'Error creating collection',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
     <div className="fixed top-0 left-0 w-full" style={{ zIndex: 1000 }}>
      <MarketplaceAppBar />
  
</div>

      {loading && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md" style={{ zIndex: 900 }}>
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <div className="mt-4 text-white font-medium">Creating Collection...</div>
    </div>
  </div>
)}

      {!collectionMintAddress ? (
       <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-lg p-8 mt-10 shadow-lg relative" style={{ zIndex: 1 }}>
          <form onSubmit={handleCreateCollection} className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create New Collection</h2>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Collection Name
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter collection name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Symbol
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-500">{errors.symbol}</p>
              )}
            </div>

            <div>
              
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter collection description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Collection Image
              </label>
              <input
                type="file"
                accept="image/*"
                name="image"
                onChange={handleInputChange}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.image ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={loading}
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-500">{errors.image}</p>
              )}
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Seller Fee (%)
              </label>
              <input
                type="number"
                className={`w-full px-4 py-2 bg-gray-700 border rounded-md text-white 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 
                  ${errors.sellerFeeBasisPoints ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Enter seller fee percentage (0-100)"
                name="sellerFeeBasisPoints"
                value={formData.sellerFeeBasisPoints / 100}
                onChange={handleInputChange}
                disabled={loading}
                min="0"
                max="100"
                step="0.01"
              />
              {errors.sellerFeeBasisPoints && (
                <p className="mt-1 text-sm text-red-500">{errors.sellerFeeBasisPoints}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Phí bán hàng sẽ được tính theo phần trăm của giá bán
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium
                ${loading 
                  ? 'bg-purple-500/50 cursor-not-allowed' 
                  : 'bg-purple-500 hover:bg-purple-600'
                } transition-colors duration-300 flex items-center justify-center`}
            >
              <NotificationList />
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Collection...
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-lg p-8 mt-10 shadow-lg relative z-10">
          <MarketplaceAppBar />
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src={imagePreview || ''}
                alt="Collection"
                className="h-24 w-24 rounded-lg object-cover"
              />
              <h2 className="text-3xl font-bold text-white">
                {formData.name}
              </h2>
            </div>
            <div className="bg-green-500/20 text-green-400 py-2 px-4 rounded-full inline-flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Collection Created Successfully
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-gray-400 text-sm">Collection Address</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 bg-gray-700/50 px-3 py-2 rounded-lg text-purple-400">
                  {collectionMintAddress}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(collectionMintAddress)}
                  className="p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-gray-400 text-sm">Symbol</label>
                <p className="mt-1 text-white font-medium">{formData.symbol}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Royalty Fee</label>
                <p className="mt-1 text-white font-medium">
                  {(formData.sellerFeeBasisPoints / 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Description</label>
              <p className="mt-1 text-white">{formData.description}</p>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={() => setCollectionMintAddress("")}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
              >
                Create Another Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};