import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletButton: FC = () => {
  return (
    <div className="flex justify-center">
      <WalletMultiButton 
        className="px-8 py-4 bg-purple-600 rounded-lg font-medium text-white
          hover:bg-purple-700 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
      />
    </div>
  );
};