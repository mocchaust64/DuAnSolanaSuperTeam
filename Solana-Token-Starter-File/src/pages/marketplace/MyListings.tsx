// src/components/marketplace/MyListings.tsx
import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const MyListings: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Listed NFTs</h2>
      {!publicKey ? (
        <p>Please connect your wallet to view listings</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* NFT listings sẽ được thêm sau */}
        </div>
      )}
    </div>
  );
};