import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from '@solana/web3.js';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { notify } from '@/utils/notifications';
import { BN } from 'bn.js';
import { Keypair } from '@solana/web3.js';

export const MarketplaceSetup: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useAnchorProgram();

  const [fee, setFee] = useState('200'); // 2% default
  const [treasuryWallet, setTreasuryWallet] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketplaceAddress, setMarketplaceAddress] = useState<string | null>(null);

  // Khai báo marketplaceConfig ở đây
  const [marketplaceConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    program?.programId || PublicKey.default
  );

  // Load marketplace address from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketplace_address');
      if (saved) setMarketplaceAddress(saved);
    }
  }, []);

  const handleInitialize = async () => {
    if (!publicKey || !program) return;

    try {
      setIsProcessing(true);
      console.log("Starting marketplace initialization...");

      // Tạo keypair mới cho marketplace
      const marketplaceKeypair = Keypair.generate();
      console.log("New marketplace keypair:", {
        publicKey: marketplaceKeypair.publicKey.toBase58(),
        secretKey: marketplaceKeypair.secretKey
      });

      // Validate treasury wallet
      let treasuryPublicKey: PublicKey;
      try {
        treasuryPublicKey = new PublicKey(treasuryWallet);
      } catch {
        throw new Error('Treasury wallet address không hợp lệ');
      }

      // Initialize với keypair mới
      const feePoints = new BN(parseInt(fee));
      const initTx = await program.methods
        .initializeMarketplace(feePoints)
        .accounts({
          authority: publicKey,
          config: marketplaceKeypair.publicKey,
          treasuryWallet: treasuryPublicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([marketplaceKeypair])  // Thêm marketplace keypair vào signers
        .rpc();

      await program.provider.connection.confirmTransaction(initTx);

      // Verify sau khi initialize
      const postInitAccount = await connection.getAccountInfo(marketplaceKeypair.publicKey);
      console.log("Post-init state:", {
        exists: !!postInitAccount,
        owner: postInitAccount?.owner.toBase58(),
        expectedOwner: program.programId.toBase58()
      });

      // Verify data
      const marketplaceData = await program.account.marketplaceConfig.fetch(
        marketplaceKeypair.publicKey
      );
      console.log("New marketplace data:", {
        authority: marketplaceData.authority.toBase58(),
        treasury: marketplaceData.treasuryWallet.toBase58(),
        feePercentage: marketplaceData.feePercentage,
        isPaused: marketplaceData.isPaused
      });

      // Lưu địa chỉ marketplace mới
      localStorage.setItem('marketplace_address', marketplaceKeypair.publicKey.toBase58());
      setMarketplaceAddress(marketplaceKeypair.publicKey.toBase58());

      notify({ 
        type: 'success', 
        message: 'Marketplace initialized successfully!',
        txid: initTx 
      });

    } catch (error) {
      console.error('Error in setup process:', error);
      notify({ 
        type: 'error', 
        message: 'Failed to setup marketplace',
        description: error.message 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace Setup</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Close Marketplace</h2>
        <button
          onClick={async () => {
            if (!publicKey || !program) return;
            
            try {
              setIsProcessing(true);
              
              console.log("Closing marketplace:", marketplaceConfig.toBase58());
              
              // Verify current state
              const currentAccount = await connection.getAccountInfo(marketplaceConfig);
              console.log("Current state:", {
                exists: !!currentAccount,
                owner: currentAccount?.owner.toBase58()
              });

              const closeTx = await program.methods
                .closeMarketplace()
                .accounts({
                  authority: publicKey,
                  config: marketplaceConfig,
                  systemProgram: SystemProgram.programId,
                })
                .rpc();
                
              await program.provider.connection.confirmTransaction(closeTx);
              
              // Verify close
              const closedAccount = await connection.getAccountInfo(marketplaceConfig);
              console.log("After close:", {
                exists: !!closedAccount,
                owner: closedAccount?.owner.toBase58()
              });

              localStorage.removeItem('marketplace_address');
              setMarketplaceAddress(null);

              notify({ 
                type: 'success', 
                message: 'Marketplace closed successfully!',
                txid: closeTx 
              });
            } catch (error) {
              console.error('Error closing marketplace:', error);
              notify({ 
                type: 'error', 
                message: 'Failed to close marketplace',
                description: error.message 
              });
            } finally {
              setIsProcessing(false);
            }
          }}
          disabled={isProcessing}
          className={`w-full px-4 py-2 rounded-md text-white
            ${isProcessing 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
            }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Đang xử lý...
            </div>
          ) : (
            'Close Marketplace'
          )}
        </button>
      </div>
      
      {marketplaceAddress ? (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Marketplace Hiện Tại</h2>
          <p className="text-gray-300 break-all">{marketplaceAddress}</p>
          <button
            onClick={() => {
              localStorage.removeItem('marketplace_address');
              setMarketplaceAddress(null);
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
          >
            Reset Marketplace
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Treasury Wallet Address
              </label>
              <input
                type="text"
                value={treasuryWallet}
                onChange={(e) => setTreasuryWallet(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="Nhập địa chỉ ví treasury"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Marketplace Fee (basis points)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="200 = 2%"
              />
              <p className="mt-1 text-sm text-gray-400">
                1 basis point = 0.01%
              </p>
            </div>

            <button
              onClick={handleInitialize}
              disabled={isProcessing || !treasuryWallet || !fee}
              className={`w-full px-4 py-2 rounded-md font-semibold text-white
                ${isProcessing || !treasuryWallet || !fee
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Đang xử lý...
                </div>
              ) : (
                'Khởi tạo Marketplace'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSetup;

