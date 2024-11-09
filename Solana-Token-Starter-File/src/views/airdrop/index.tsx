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
    <div>
      
      <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
        <div className="container">
          <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
            <div className="grid gap-10 lg:grid-cols-2">
              <Branding
                image="auth-img"
                title="Airdrop Token trên Solana"
                message="Hãy thử tạo Token, NFT trên Solana đầu tiên của bạn."
              />
              <div className="lg:ps-0 flex h-full flex-col p-10">
                <div className="pb-10">
                  <a className="flex">
                    <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                  </a>
                </div>
                <div className="my-auto pb-6 text-center">
                  <h4 className="mb-4 text-2xl font-bold text-white">
                    {wallet && (
                      <p>SOL Balance: {(balance || 0).toLocaleString()}</p>
                    )}
                  </h4>
                  <p className="text-default-300 mx-auto mb-5 max-w-sm">
                    Mỗi 24h giờ bạn có thể yêu cầu 1 Airdrop và sử dụng nó để thử nghiệm và tạo token trên nền tảng của chúng tôi.
                  </p>
                  <div className="flex items-start justify-center">
                    <img src="assets/images/logout.svg" alt="" className="h-40"/>
                  </div>
                  <div className="mb-6 text-center">
                    <button
                      onClick={onClick}
                      disabled={!publicKey || isLoading}
                      className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                    >
                      <span className="fw-bold">
                        {isLoading ? 'Processing...' : 'Airdrop 1'}
                      </span>
                    </button>
                    <CloseModal />
                    
                  </div>
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