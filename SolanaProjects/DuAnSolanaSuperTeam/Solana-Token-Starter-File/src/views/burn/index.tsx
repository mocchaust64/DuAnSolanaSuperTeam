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
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Đốt Token"
                  message="Đốt token để giảm tổng cung và tăng giá trị token của bạn"
                />
                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                    </a>
                  </div>
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-4 text-2xl font-bold text-white">
                      Đốt Token
                    </h4>
                    <p className="text-default-300 mx-auto mb-5 max-w-sm">
                      Nhập địa chỉ token và số lượng token muốn đốt
                    </p>
                    <div className="text-start">
                      <InputView
                        name="Địa chỉ Token"
                        placeholder="Nhập địa chỉ token mint"
                        clickhandle={(e) => handleInputChange("tokenMint", e.target.value)}
                      />
                      <InputView
                        name="Số lượng"
                        placeholder="Nhập số lượng token muốn đốt"
                        clickhandle={(e) => handleInputChange("amount", e.target.value)}
                      />
                      <div className="mb-6 text-center">
                        <button
                          onClick={burnToken}
                          disabled={isLoading}
                          className={`bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span className="fw-bold">
                            {isLoading ? "Đang xử lý..." : "Đốt Token"}
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
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Burn Token Thành Công"
                  message="Token của bạn đã được đốt thành công"
                />

                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-8 text-2xl font-bold text-white">
                      Thông tin Burn Token
                    </h4>
                    
                    <div className="mb-8">
                      {burnedTokenInfo.tokenImage ? (
                        <img 
                          src={burnedTokenInfo.tokenImage} 
                          alt="token" 
                          className="mx-auto h-32 w-32 object-contain rounded-full border-2 border-blue-500"
                        />
                      ) : (
                        <div className="mx-auto h-32 w-32 rounded-full border-2 border-gray-500 flex items-center justify-center">
                          <span className="text-default-300">Không có ảnh token</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full text-center">
                      <InputView
                        name="Địa chỉ Token"
                        placeholder={burnedTokenInfo.tokenMint}
                      />
                      {burnedTokenInfo.decimals === 0 ? (
                        <p className="text-default-300 text-base font-medium leading-6 mt-4">
                          <span>NFT đã được burn thành công</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-default-300 text-base font-medium leading-6 mt-4">
                            <span>Số lượng đã đốt: {burnedTokenInfo.amount}</span>
                          </p>
                          <p className="text-default-300 text-base font-medium leading-6 mt-2">
                            <span>Tổng cung hiện tại: {burnedTokenInfo.totalSupply.toLocaleString()}</span>
                          </p>
                        </>
                      )}

                      <div className="mb-6 text-center">
                        <a
                          href={`https://explorer.solana.com/address/${burnedTokenInfo.tokenMint}?cluster=${networkConfiguration}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                        >
                          <span className="fw-bold">
                            Xem trên Solana Explorer
                          </span>
                        </a>
                      </div>

                      <ul className="flex flex-wrap items-center justify-center gap-2">
                        <li>
                          <a
                            onClick={() => setOpenBurnModal(false)}
                            className="group inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-2xl transition-all duration-500 hover:bg-blue-600/60"
                          >
                            <i className="text-2xl text-white group-hover:text-white">
                              <AiOutlineClose />
                            </i>
                          </a>
                        </li>
                      </ul>
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