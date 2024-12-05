import { FC, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { getMetadata } from '../../../utils/accounts';
import { notify } from '../../../utils/notifications';

export const ViewCollection: FC = () => {
  const router = useRouter();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<any>(null);
  const { mintAddress } = router.query;

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!mintAddress) return;

      try {
        setLoading(true);
        const mintPublicKey = new PublicKey(mintAddress as string);
        
        // Fetch metadata account
        const metadataPDA = await getMetadata(mintPublicKey);
        const metadataAccount = await connection.getAccountInfo(metadataPDA);
        
        if (metadataAccount) {
          // Parse metadata
          setCollectionData({
            // Set collection data
          });
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
        notify({
          type: 'error',
          message: 'Error loading collection',
          description: 'Could not load collection data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [mintAddress, connection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Collection not found</h2>
        <p className="text-gray-400 mt-2">The collection you're looking for doesn't exist</p>
        <button
          onClick={() => router.push('/collections')}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          View All Collections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-start space-x-6">
          <img
            src={collectionData.image}
            alt={collectionData.name}
            className="w-32 h-32 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">{collectionData.name}</h1>
            <p className="text-gray-400 mt-2">{collectionData.symbol}</p>
            <p className="text-gray-300 mt-4">{collectionData.description}</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-400">Royalty Fee:</span>
                <span className="text-white ml-2">
                  {collectionData.sellerFeeBasisPoints / 100}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Created by:</span>
                <a
                  href={`https://explorer.solana.com/address/${collectionData.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:text-purple-400 ml-2"
                >
                  {collectionData.creator.slice(0, 4)}...{collectionData.creator.slice(-4)}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};