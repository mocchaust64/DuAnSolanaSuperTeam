// src/pages/marketplace/mint.tsx
import { MintNFT } from '../../components/marketplace/MintNFT';
import { WalletButton } from '../../components/common/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { MarketplaceAppBar } from '../../components/marketplace/MarketplaceAppBar';

export default function MintPage() {
  const { connected } = useWallet();
  
  return (
    <>
      <MarketplaceAppBar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-white mb-12">
          Mint Your NFT
        </h1>
        
        {!connected ? (
          <div className="max-w-md mx-auto text-center bg-gray-800/50 rounded-xl p-8">
            <p className="text-gray-300 mb-6">
              Please connect your wallet to mint NFTs
            </p>
            <WalletButton />
          </div>
        ) : (
          <MintNFT />
        )}
      </div>
    </>
  );
}