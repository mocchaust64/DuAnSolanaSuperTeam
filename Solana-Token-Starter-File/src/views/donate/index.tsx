import React, { FC, useEffect, useCallback, useState } from "react";
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore"; // Đảm bảo đây là đường dẫn đúng
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  TransactionSignature,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { notify } from "utils/notifications";
import { AiOutlineClose } from "react-icons/ai";

// NHẬP NỘI BỘ
import { InputView } from "../input";
import Branding from "../../components/Branding";

export const DonateView = ({ setOpenSendTransaction }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState("0.0");

  // Lấy số dư SOL từ cửa hàng
  const balance = useUserSOLBalanceStore((state) => state.balance); // Điều chỉnh theo cách triển khai cửa hàng của bạn

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({
        type: "error",
        message: "Xin lỗi, có lỗi xảy ra",
        description: "Ví chưa được kết nối",
      });
      return;
    }

    const creatorAddress = new PublicKey("4Y2QEEKxA2vSybvB9qZAtfMMYFY8ByXi2Avstq82MBCf");
    let signature: TransactionSignature = "";
    try {
      const transition = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: creatorAddress,
          lamports: LAMPORTS_PER_SOL * Number(amount),
        })
      );
      signature = await sendTransaction(transition, connection);

      notify({
        type: "success",
        message: `Bạn đã chuyển khoản thành công ${amount} SOL`,
        txid: signature,
      });
    } catch (error: any) {
      notify({
        type: "error",
        message: "Giao dịch thất bại",
        description: error?.message,
        txid: signature,
      });
      return;
    }
  }, [publicKey, amount, sendTransaction, connection]);

  // THÀNH PHẦN
  const CloseModal = () => (
    <a
      onClick={() => setOpenSendTransaction(false)}
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
                title="Xây dựng token Solana của bạn"
                message="Hãy thử tạo dự án Solana đầu tiên của bạn, và nếu bạn muốn thành thạo phát triển blockchain, hãy kiểm tra khóa học"
              />
              <div className="lg:ps-0 flex h-full flex-col p-10">
                <div className="pb-10">
                  <a className="flex">
                    <img src="assets/images /logo1.png" alt="logo" className="h-10" />
                  </a>
                </div>
                <div className="my-auto pb-6 text-center">
                  <h4 className="mb-4 text-2xl font-bold text-white">
                    {wallet && (
                      <p>
                        Số dư SOL: {(balance || 0).toLocaleString()}
                      </p>
                    )}
                  </h4>
                  <p className="text-default-300 mx-auto mb-5 max-w-sm">
                    Bây giờ bạn có thể quyên góp cho người tạo để phát triển công cụ
                  </p>
                  <div className="flex items-start justify-center">
                    <img src="assets/images/logout.svg" alt="" className="h-40" />
                  </div>

                  <div className="text-start">
                    <InputView
                      name="Amount"
                      placeholder="amount"
                      clickhandle={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="mb-6 text-center">
                    <button
                      onClick={onClick}
                      disabled={!publicKey}
                      className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                    >
                      <span className="fw-bold">Quyên góp</span>
                    </button>
                    <CloseModal />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};