import { FC, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { CollectionCard } from './CollectionCard';
import { useAnchorProgram } from '../../../hooks/useAnchorProgram';
import { notify } from '../../../utils/notifications';
import { PublicKey } from '@solana/web3.js';

interface NFTCollection {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
}

interface CollectionListProps {
  onSelectCollection: (collection: NFTCollection) => void;
  selectedMint?: string;
}

export const CollectionList: FC<CollectionListProps> = ({
  onSelectCollection,
  selectedMint
}) => {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey || !program) return;
    
    const fetchCollections = async () => {
      try {
        setLoading(true);
        // Fetch collections từ program
        // Đây là ví dụ, bạn cần implement theo cấu trúc program của mình
        const userCollections = await program.account.collection.all([
          {
            memcmp: {
              offset: 8, // Sau discriminator
              bytes: publicKey.toBase58()
            }
          }
        ]);

        setCollections(userCollections.map(c => ({
          mint: c.account.mint.toString(),
          name: c.account.name,
          symbol: c.account.symbol,
          uri: c.account.uri
        })));
      } catch (error) {
        console.error('Error fetching collections:', error);
        notify({ 
          type: 'error', 
          message: 'Failed to load collections' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [publicKey, program]);

  if (loading) {
    return <div>Loading collections...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map(collection => (
        <CollectionCard
          key={collection.mint}
          mint={new PublicKey(collection.mint)}
          name={collection.name}
          symbol={collection.symbol}
          uri={collection.uri}
          onSelect={onSelectCollection ? () => onSelectCollection(collection) : undefined}
        />
      ))}
    </div>
  );
};