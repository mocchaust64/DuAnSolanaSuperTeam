import React, { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { notify } from "../../utils/notifications";
import { BN } from "@project-serum/anchor";
import { getProgram } from "../../utils/program";
import { InputView } from "../input";
import { AiOutlineClose } from "react-icons/ai";
import Branding from "../../components/Branding";
import NotificationList from "../../components/Notification";
import { getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useNetworkConfiguration } from "../../contexts/NetworkConfigurationProvider";
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

interface BurnViewProps {
  setOpenBurnModal: (value: boolean) => void;
}

export const BurnView: FC<BurnViewProps> = ({ setOpenBurnModal }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [burnData, setBurnData] = useState({
    tokenMint: "",
    amount: "",
    decimals: 9,
  });
  const [inputValues, setInputValues] = useState({
    tokenMint: "",
    amount: ""
  });
  const [burnedTokenInfo, setBurnedTokenInfo] = useState({
    tokenMint: "",
    amount: "",
    totalSupply: 0,
    tokenImage: "",
    decimals: 9,
    success: false
  });
  const { networkConfiguration } = useNetworkConfiguration();

  const CloseModal = () => (
    <a
      onClick={() => setOpenBurnModal(false)}
      className="group mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-2xl transition-all duration-500 hover:bg-blue-600/60"
    >
      <i className="text-2xl text-white group-hover:text-white">
        <AiOutlineClose />
      </i>
    </a>
  );

  const handleInputChange = (field: string, value: string) => {
    setInputValues(prev => ({...prev, [field]: value}));
    setBurnData(prev => ({...prev, [field]: value}));
  };

  const burnToken = useCallback(async () => {
    if (!publicKey) {
      notify({ type: "error", message: "Vui lòng kết nối ví" });
      return;
    }

    if (!burnData.tokenMint || !burnData.amount) {
      notify({ type: "error", message: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    try {
      setIsLoading(true);

      const mintPublicKey = new PublicKey(burnData.tokenMint);
      
      // Lấy decimals trước
      const decimals = await getTokenDecimals(mintPublicKey);
      if (!decimals && decimals !== 0) {
        throw new Error("Không thể lấy được số decimals của token");
      }

      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      const program = getProgram(connection, publicKey);
      const transaction = new Transaction();

      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      transaction.add(modifyComputeUnits, addPriorityFee);

      // Tính toán số lượng token với decimals đã lấy được
      const burnAmount = calculateTokenAmount(burnData.amount, decimals);

      const burnIx = await program.methods
        .burnToken(burnAmount)
        .accounts({
          mint: mintPublicKey,
          tokenAccount: tokenAccount,
          authority: publicKey,
        })
        .instruction();

      transaction.add(burnIx);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 5,
        preflightCommitment: 'confirmed'
      });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      // Lấy tổng cung và metadata sau khi burn
      const totalSupply = await getTokenSupply(mintPublicKey);
      const tokenImage = await getTokenMetadata(mintPublicKey);

      // Cập nhật thông tin và chuyển sang form thành công
      setBurnedTokenInfo({
        tokenMint: burnData.tokenMint,
        amount: burnData.amount,
        totalSupply: totalSupply,
        tokenImage: tokenImage,
        decimals: decimals,
        success: true
      });

      notify({
        type: "success",
        message: "Đã đốt token thành công!",
        txid: signature,
      });

    } catch (error) {
      console.error(error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, burnData]);

  const handleError = (error: any) => {
    let errorMessage = "Đốt token thất bại";

    if (error.message.includes('Transaction simulation failed')) {
      errorMessage = "Giao dịch thất bại trong quá trình mô phỏng";
    } else if (error.message.includes('Blockhash not found')) {
      errorMessage = "Blockhash không hợp lệ, vui lòng thử lại";
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = "Không đủ SOL để thực hiện giao dịch";
    }

    notify({ type: "error", message: errorMessage });
  };

  const calculateTokenAmount = (amount: string, decimals: number): BN => {
    try {
      // Với NFT (decimals = 0), amount luôn là 1
      if (decimals === 0) {
        return new BN(1);
      }
      
      // Xử lý cho fungible token như cũ
      const cleanAmount = amount.replace(/,/g, '').replace(/\s/g, '');
      const [integerPart = '0', decimalPart = ''] = cleanAmount.split('.');
      const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
      const fullAmount = integerPart + paddedDecimal;
      const cleanNumber = fullAmount.replace(/^0+/, '') || '0';
      
      return new BN(cleanNumber);
    } catch (error) {
      throw new Error("Số lượng token không hợp lệ");
    }
  };

  const getTokenDecimals = async (mintAddress: PublicKey): Promise<number> => {
    try {
      // Kiểm tra địa chỉ token có hợp lệ không
      const accountInfo = await connection.getAccountInfo(mintAddress);
      if (!accountInfo) {
        throw new Error("Token không tồn tại");
      }

      // Kiểm tra xem có phải token account không
      if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        throw new Error("Địa chỉ không phải là token");
      }

      const mintInfo = await getMint(connection, mintAddress);
      return mintInfo.decimals;
    } catch (error) {
      console.error("Lỗi khi lấy decimals:", error);
      notify({ 
        type: "error", 
        message: "Địa chỉ token không hợp lệ"
      });
      throw new Error("Không thể lấy được số decimals của token");
    }
  };

  const getTokenSupply = async (mintAddress: PublicKey): Promise<number> => {
    try {
      const mintInfo = await getMint(connection, mintAddress);
      return Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
    } catch (error) {
      console.error("Lỗi khi lấy tổng cung:", error);
      throw new Error("Không thể lấy được tổng cung token");
    }
  };

  const getTokenMetadata = async (mintAddress: PublicKey): Promise<string> => {
    try {
      const metadataPDA = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          mintAddress.toBuffer()
        ],
        PROGRAM_ID
      )[0];

      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      if (!metadataAccount) {
        console.error("Không tìm thấy metadata account");
        return "";
      }

      const [metadata, _] = await Metadata.deserialize(metadataAccount.data);
      if (!metadata.data.uri) {
        console.error("URI không tồn tại trong metadata");
        return "";
      }

      // Fetch full metadata từ URI
      const response = await fetch(metadata.data.uri);
      const fullMetadata = await response.json();
      
      return fullMetadata.image || "";
    } catch (error) {
      console.error("Lỗi khi lấy metadata:", error);
      return "";
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <NotificationList />
      </div>
      
      {!burnedTokenInfo.success ? (
        <section className="flex w-full items-center min-h-screen py-6 px-4 lg:p-10 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
          <div className="container mx-auto relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-40 left-20 w-72 h-72 bg-pink-500/30 rounded-full filter blur-[100px]" />
              <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500/30 rounded-full filter blur-[100px]" />
            </div>

            <div className="bg-black/30 backdrop-blur-xl mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl relative z-10">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Đốt Token"
                  message="Đốt token để giảm tổng cung và tăng giá trị token của bạn"
                />
                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10 transform hover:scale-105 transition-all duration-300">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-12" />
                    </a>
                  </div>
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-4 text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Đốt Token
                    </h4>
                    <p className="text-gray-300 mx-auto mb-8 max-w-sm">
                      Nhập địa chỉ token và số lượng token muốn đốt
                    </p>
                    <div className="space-y-6">
                      <div className="transform transition-all duration-300 hover:scale-[1.02]">
                        <InputView
                          name="Địa chỉ Token"
                          placeholder="Nhập địa chỉ token mint"
                          clickhandle={(e) => handleInputChange("tokenMint", e.target.value)}
                        />
                      </div>
                      <div className="transform transition-all duration-300 hover:scale-[1.02]">
                        <InputView
                          name="Số lượng"
                          placeholder="Nhập số lượng token muốn đốt"
                          clickhandle={(e) => handleInputChange("amount", e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <button
                          onClick={burnToken}
                          disabled={isLoading}
                          className={`relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600
                            group w-full py-3 px-6 rounded-xl font-bold text-lg
                            transition-all duration-300 transform
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'}
                            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
                            before:via-white/10 before:to-transparent before:translate-x-[-200%]
                            hover:before:translate-x-[200%] before:transition-transform before:duration-700`}
                        >
                          <span className="relative z-10">
                            {isLoading ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white/90 
                                rounded-full animate-spin"/>
                                <span>Đang xử lý...</span>
                              </div>
                            ) : (
                              "Đốt Token"
                            )}
                          </span>
                        </button>
                        <CloseModal />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex w-full items-center min-h-screen py-6 px-4 lg:p-10 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
          <div className="container mx-auto relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-40 left-20 w-72 h-72 bg-green-500/30 rounded-full filter blur-[100px]" />
              <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500/30 rounded-full filter blur-[100px]" />
            </div>

            <div className="bg-black/30 backdrop-blur-xl mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl relative z-10">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Burn Token Thành Công"
                  message="Token của bạn đã được đốt thành công"
                />

                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-8 text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      Thông tin Burn Token
                    </h4>
                    
                    <div className="mb-8 transform hover:scale-105 transition-all duration-500">
                      {burnedTokenInfo.tokenImage ? (
                        <img 
                          src={burnedTokenInfo.tokenImage} 
                          alt="token" 
                          className="mx-auto h-32 w-32 object-contain rounded-full 
                            border-2 border-blue-500/50 transform hover:rotate-12
                            transition-all duration-500 hover:shadow-lg
                            hover:shadow-blue-500/30"
                        />
                      ) : (
                        <div className="mx-auto h-32 w-32 rounded-full border-2 border-gray-500/50 
                          flex items-center justify-center bg-gray-800/50 backdrop-blur-xl">
                          <span className="text-gray-400">Không có ảnh token</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full text-center space-y-6">
                      <div className="transform hover:scale-[1.02] transition-all duration-300">
                        <InputView
                          name="Địa chỉ Token"
                          placeholder={burnedTokenInfo.tokenMint}
                        />
                      </div>
                      
                      {burnedTokenInfo.decimals === 0 ? (
                        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/20">
                          <p className="text-green-400 text-lg font-medium">
                            NFT đã được burn thành công
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl p-4 border border-blue-500/20">
                            <p className="text-blue-400 text-lg font-medium">
                              Số lượng đã đốt: {burnedTokenInfo.amount}
                            </p>
                          </div>
                          <div className="bg-purple-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
                            <p className="text-purple-400 text-lg font-medium">
                              Tổng cung hiện tại: {burnedTokenInfo.totalSupply.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pt-4">
                        <a
                          href={`https://explorer.solana.com/address/${burnedTokenInfo.tokenMint}?cluster=${networkConfiguration}`}
                          target="_blank"
                          rel="noreferrer"
                          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600
                            group inline-flex w-full items-center justify-center rounded-xl px-6 py-3
                            text-white font-bold text-lg transition-all duration-300 transform
                            hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25
                            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
                            before:via-white/10 before:to-transparent before:translate-x-[-200%]
                            hover:before:translate-x-[200%] before:transition-transform before:duration-700"
                        >
                          <span className="relative z-10">
                            Xem trên Solana Explorer
                          </span>
                        </a>

                        <button
                          onClick={() => setOpenBurnModal(false)}
                          className="w-full px-6 py-3 rounded-xl bg-white/5 backdrop-blur-xl
                            border border-white/10 text-white font-bold
                            transition-all duration-300 transform hover:scale-[1.02]
                            hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default BurnView;