import React, { FC, useEffect, useCallback, useState } from "react";
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, TransactionSignature } from "@solana/web3.js";
import { notify } from "../../utils/notifications";
import { AiOutlineClose } from "react-icons/ai";
import Branding from "../../components/Branding";
import NotificationList from "../../components/Notification";

interface AirdropViewProps {
  setOpenAirdrop: (open: boolean) => void;
}

export const AirdropView: FC<AirdropViewProps> = ({ setOpenAirdrop }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  useEffect(() => {
    let mounted = true;
    if (wallet.publicKey) {
      getUserSOLBalance(wallet.publicKey, connection);
    }
    return () => {
      mounted = false;
    };
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({
        type: "error",
        message: "Error",
        description: "Wallet not connected",
      });
      return;
    }

    setIsLoading(true);
    let signature: TransactionSignature = "";
    
    try {
      signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      notify({
        type: "success", 
        message: "Bạn đã yêu cầu thành công 1 Airdrop",
        txid: signature,
      });

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });
      getUserSOLBalance(publicKey, connection);

    } catch (error: any) {
      notify({
        type: "error",
        message: "Yêu cầu Airdrop thất bại thử lại sau 24h",
        description: error?.message,
        txid: signature,
      });
      console.log("error", `airdrop failed ${error.message}`, signature);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, getUserSOLBalance]);

  const CloseModal = () => (
    <a 
      onClick={() => setOpenAirdrop(false)}
      className="group mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-2xl transition-all duration-500 hover:bg-blue-600/60"
    >
      <i className="text-2xl text-white group-hover:text-white">
        <AiOutlineClose />
      </i>
    </a>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900">
      <div className="absolute inset-0">
        <div className="absolute top-40 left-20 w-72 h-72 bg-blue-500/20 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-40 right-20 w-72 h-72 bg-purple-500/20 rounded-full filter blur-[100px]" />
      </div>

      <section className="relative z-10 flex w-full items-center py-6 px-4 lg:h-screen lg:p-10">
        <div className="container mx-auto">
          <div className="bg-white/5 backdrop-blur-xl overflow-hidden rounded-2xl border border-white/10
            shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]
            transition-all duration-500">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Left Column */}
              <div className="relative overflow-hidden p-10 flex flex-col justify-center
                bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <h2 className="relative text-3xl md:text-4xl font-bold 
                  bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 
                  bg-clip-text text-transparent mb-6">
                  Airdrop Token trên Solana
                </h2>
                <p className="relative text-gray-300 text-lg mb-8">
                  Hãy thử tạo Token, NFT trên Solana đầu tiên của bạn.
                </p>
                <img 
                  src="assets/images/ai/auth-img.jpg" 
                  alt="Airdrop"
                  className="relative w-4/5 mx-auto transform hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Right Column */}
              <div className="p-10 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <img src="assets/images/logo1.png" alt="logo" className="h-12 hover:opacity-80 transition-opacity" />
                  <CloseModal />
                </div>

                <div className="flex-1 flex flex-col justify-center items-center">
                  {/* Balance Display */}
                  {wallet && (
                    <div className="bg-white/5 rounded-2xl p-6 mb-8 w-full
                      border border-white/10 transform hover:scale-[1.02] transition-all duration-300">
                      <p className="text-gray-400 text-sm mb-2">Current Balance</p>
                      <h3 className="text-3xl font-bold text-white">
                        {(balance || 0).toLocaleString()} SOL
                      </h3>
                    </div>
                  )}

                  {/* Info Section */}
                  <div className="text-center mb-8">
                    <img 
                      src="assets/images/logout.svg" 
                      alt="" 
                      className="h-48 mx-auto mb-6 transform hover:scale-110 transition-transform duration-500"
                    />
                    <p className="text-gray-300 text-lg max-w-sm mx-auto">
                      Mỗi 24h giờ bạn có thể yêu cầu 1 Airdrop và sử dụng nó để thử nghiệm
                      và tạo token trên nền tảng của chúng tôi.
                    </p>
                  </div>

                  {/* Airdrop Button */}
                  <button
                    onClick={onClick}
                    disabled={!publicKey || isLoading}
                    className={`
                      relative w-full py-4 rounded-xl font-bold text-lg
                      transition-all duration-500 transform
                      ${!publicKey || isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25'
                      }
                      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
                      before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000
                    `}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white font-extrabold tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                          Processing...
                        </span>
                      </div>
                    ) : (
                      <span className="text-white font-extrabold tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                        Airdrop 1 SOL
                      </span>
                    )}
                  </button>
                </div>

                <NotificationList />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};