import { FC } from 'react';
import { PublicKey } from '@solana/web3.js';

interface CollectionCardProps {
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  onSelect?: () => void;
}

export const CollectionCard: FC<CollectionCardProps> = ({
  mint,
  name,
  symbol,
  uri,
  onSelect
}) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-600">{symbol}</p>
          <p className="text-xs text-gray-500 truncate">{mint.toString()}</p>
        </div>
        {onSelect && (
          <button
            onClick={onSelect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
};