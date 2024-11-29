// src/pages/marketplace.tsx
import { FC, useState } from 'react';
import { MarketplaceAppBar } from '@/components/marketplace/MarketplaceAppBar';
import { NFTGrid } from '@/components/marketplace/NFTGrid';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateNFTSection } from '@/views/marketplace/CreateNFTSection';
import { BrowseNFT } from '@/pages/marketplace/BrowseNFT';
import {} from '@/components/marketplace/MintNFT'



const Marketplace: FC = () => {
  const { publicKey } = useWallet();
  const [openMintModal, setOpenMintModal] = useState(false);

  return (
    <div className="min-h-screen bg-default-900 select-none">
      <MarketplaceAppBar />
      <CreateNFTSection setOpenMintModal={setOpenMintModal} />
      
      <div className="container mx-auto px-4"> {/* Removed id="browse-nfts" and scroll-mt-28 */}
        {publicKey ? (
          <BrowseNFT />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect your wallet to view NFTs</h2>
            <p className="text-gray-400 mb-8">Browse, buy and sell NFTs on our marketplace</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;