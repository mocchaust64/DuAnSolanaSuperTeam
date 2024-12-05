// src/components/marketplace/NFTGrid.tsx
import { FC } from 'react';
import { NFTCard } from './NFTCard';

interface NFT {
  id: number;
  name: string;
  image: string;
  price?: number;
  creator?: string;
  isListed?: boolean;
}

interface NFTGridProps {
  nfts: NFT[];
  onBuy?: (id: number) => void;
  onList?: (id: number) => void;
}

export const NFTGrid: FC<NFTGridProps> = ({ nfts, onBuy, onList }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          {...nft}
          onBuy={() => onBuy?.(nft.id)}
          onList={() => onList?.(nft.id)}
        />
      ))}
    </div>
  );
};