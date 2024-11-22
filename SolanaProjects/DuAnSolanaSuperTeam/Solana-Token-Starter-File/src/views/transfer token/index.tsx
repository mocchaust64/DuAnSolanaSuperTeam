import React, { FC, useCallback, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { notify } from "../../utils/notifications";
import { BN } from "@project-serum/anchor";
import { getProgram } from "../../utils/program";
import { InputView } from "../input";
import { AiOutlineClose } from "react-icons/ai";
import Branding from "../../components/Branding";
import NotificationList from "../../components/Notification";
import { useNetworkConfiguration } from "../../contexts/NetworkConfigurationProvider";
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

interface TransferViewProps {
  setOpenTransferModal: (value: boolean) => void;
}

interface UserToken {
  mint: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
  image?: string;
}

interface TransferredTokenInfo {
  tokenMint: string;
  receiver: string;
  amount: string;
  balance: number;
  tokenImage: string;
  decimals: number;
  success: boolean;
}

export const TransferView: FC<TransferViewProps> = ({ setOpenTransferModal }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { networkConfiguration } = useNetworkConfiguration();

  const [transferData, setTransferData] = useState({
    tokenMint: "",
    receiver: "",
    amount: "",
  });

  const [transferredTokenInfo, setTransferredTokenInfo] = useState({
    tokenMint: "",
    receiver: "",
    amount: "",
    balance: 0,
    tokenImage: "",
    decimals: 9,
    success: false
  });

  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<UserToken | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setTransferData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const CloseModal = () => {
    return (
      <button
        onClick={() => setOpenTransferModal(false)}
        className="group mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-2xl transition-all duration-500 hover:bg-blue-600/60"
      >
        <i className="text-2xl text-white group-hover:text-white">
          <AiOutlineClose />
        </i>
      </button>
    );
  };

  const transferToken = useCallback(async () => {
    if (!publicKey) {
      notify({ type: "error", message: "Vui lòng kết nối ví" });
      return;
    }

    if (!transferData.tokenMint || !transferData.receiver || !transferData.amount) {
      notify({ type: "error", message: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    try {
      setIsLoading(true);
      const program = getProgram(connection, publicKey);
      
      const mintPublicKey = new PublicKey(transferData.tokenMint);
      const receiverPublicKey = new PublicKey(transferData.receiver);
      
      // Lấy decimals trước
      const decimals = await getTokenDecimals(mintPublicKey);
      if (!decimals && decimals !== 0) {
        throw new Error("Không thể lấy được số decimals của token");
      }

      // Lấy token account của người gửi và người nhận
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );
      
      const toTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        receiverPublicKey
      );

      const transaction = new Transaction();

      // Kiểm tra và tạo token account cho người nhận nếu chưa có
      const receiverAccount = await connection.getAccountInfo(toTokenAccount);
      if (!receiverAccount) {
        const createATAIx = createAssociatedTokenAccountInstruction(
          publicKey,
          toTokenAccount,
          receiverPublicKey,
          mintPublicKey
        );
        transaction.add(createATAIx);
      }

      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      transaction.add(modifyComputeUnits, addPriorityFee);

      // Tính toán số lượng token với decimals
      const transferAmount = calculateTokenAmount(transferData.amount, decimals);

      const transferIx = await program.methods
        .transferToken(transferAmount)
        .accounts({
          mint: mintPublicKey,
          from: fromTokenAccount,
          to: toTokenAccount,
          authority: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      transaction.add(transferIx);

      // Gửi và xác nhận transaction
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

      // Lấy số dư token sau khi chuyển
      const balance = (await connection.getParsedTokenAccountsByOwner(publicKey, { mint: mintPublicKey }))
        .value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
      const tokenImage = selectedTokenInfo?.image || await getTokenMetadata(mintPublicKey);

      // Cập nhật thông tin và chuyển sang form thành công
      setTransferredTokenInfo({
        tokenMint: transferData.tokenMint,
        receiver: transferData.receiver,
        amount: transferData.amount,
        balance: balance,
        tokenImage: tokenImage,
        decimals: decimals,
        success: true
      });

      notify({
        type: "success",
        message: "Đã chuyển token thành công!",
        txid: signature,
      });

    } catch (error) {
      console.error(error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, transferData]);

  const handleError = (error: any) => {
    let errorMessage = "Chuyển token thất bại";

    if (error.message.includes('Transaction simulation failed')) {
      errorMessage = "Giao dịch thất bại trong quá trình mô phỏng";
    } else if (error.message.includes('Blockhash not found')) {
      errorMessage = "Blockhash không hợp lệ, vui lòng thử lại";
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = "Không đủ SOL để thực hiện giao dịch";
    } else if (error.message.includes('Invalid token account')) {
      errorMessage = "Token account không hợp lệ";
    }

    notify({ type: "error", message: errorMessage });
  };

  const getTokenDecimals = async (mintPublicKey: PublicKey): Promise<number> => {
    try {
      const mintInfo = await getMint(connection, mintPublicKey);
      return mintInfo.decimals;
    } catch (error) {
      console.error("Error getting token decimals:", error);
      throw error;
    }
  };

  const getTokenSupply = async (mintPublicKey: PublicKey): Promise<number> => {
    try {
      const mintInfo = await getMint(connection, mintPublicKey);
      return Number(mintInfo.supply);
    } catch (error) {
      console.error("Error getting token supply:", error);
      throw error;
    }
  };

  const getTokenMetadata = async (mintPublicKey: PublicKey): Promise<string> => {
    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          mintPublicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      if (!metadataAccount) return "";

      const metadata = Metadata.deserialize(metadataAccount.data)[0];
      return metadata.data.uri;
    } catch (error) {
      console.error("Error getting token metadata:", error);
      return "";
    }
  };

  const calculateTokenAmount = (amount: string, decimals: number): BN => {
    const cleanedAmount = amount.replace(/,/g, ".");
    const [integerPart, decimalPart = ""] = cleanedAmount.split(".");
    const paddedDecimal = decimalPart.padEnd(decimals, "0");
    const totalAmount = `${integerPart}${paddedDecimal}`;
    return new BN(totalAmount);
  };

  const getUserTokens = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokens = await Promise.all(
        tokenAccounts.value.map(async (tokenAccount) => {
          const accountData = tokenAccount.account.data.parsed.info;
          const mintAddress = accountData.mint;
          const balance = accountData.tokenAmount.uiAmount;
          
          // Lấy metadata của token
          const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              PROGRAM_ID.toBuffer(),
              new PublicKey(mintAddress).toBuffer(),
            ],
            PROGRAM_ID
          );

          try {
            const metadataAccount = await connection.getAccountInfo(metadataPDA);
            if (metadataAccount) {
              const metadata = Metadata.deserialize(metadataAccount.data)[0];
              const response = await fetch(metadata.data.uri);
              const fullMetadata = await response.json();
              
              return {
                mint: mintAddress,
                name: metadata.data.name,
                symbol: metadata.data.symbol,
                balance: balance.toString(),
                decimals: accountData.tokenAmount.decimals,
                image: fullMetadata.image || ""
              };
            }
          } catch (error) {
            console.error("Error getting metadata:", error);
          }

          return {
            mint: mintAddress,
            name: "Unknown Token",
            symbol: "Unknown",
            balance: balance.toString(),
            decimals: accountData.tokenAmount.decimals
          };
        })
      );

      setUserTokens(tokens.filter(token => token.balance !== "0"));
    } catch (error) {
      console.error("Error getting user tokens:", error);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    getUserTokens();
  }, [publicKey, getUserTokens]);

  // Hàm xử lý khi chọn token
  const handleTokenSelect = async (mintAddress: string) => {
    // Reset selectedTokenInfo khi chọn token mới
    setSelectedTokenInfo(null);
    
    const selectedToken = userTokens.find(token => token.mint === mintAddress);
    if (!selectedToken) return;

    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          new PublicKey(mintAddress).toBuffer(),
        ],
        PROGRAM_ID
      );

      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      if (metadataAccount) {
        const metadata = Metadata.deserialize(metadataAccount.data)[0];
        
        // Fetch full metadata từ URI để lấy ảnh
        const response = await fetch(metadata.data.uri);
        const fullMetadata = await response.json();
        
        setSelectedTokenInfo({
          ...selectedToken,
          name: metadata.data.name,
          image: fullMetadata.image || "" // Đảm bảo image là empty string nếu không có
        });
      } else {
        // Nếu không có metadata, set thông tin cơ bản
        setSelectedTokenInfo({
          ...selectedToken,
          name: selectedToken.name || "Unknown Token",
          image: "" // Set empty string cho image
        });
      }

      handleInputChange("tokenMint", mintAddress);
      handleInputChange("decimals", selectedToken.decimals.toString());
    } catch (error) {
      console.error("Error getting token metadata:", error);
      // Trong trưng hợp lỗi, vẫn set thông tin cơ bản
      setSelectedTokenInfo({
        ...selectedToken,
        name: selectedToken.name || "Unknown Token",
        image: ""
      });
    }
  };

  // Return JSX
  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <NotificationList />
      </div>
      
      {!transferredTokenInfo.success ? (
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Chuyển Token"
                  message="Chuyển token của bạn đến đa chỉ khác"
                />
                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                    </a>
                  </div>
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-4 text-2xl font-bold text-white">
                      Chuyển Token
                    </h4>
                    <p className="text-default-300 mx-auto mb-5 max-w-sm">
                      Nhập địa chỉ token, người nhận và số lượng token muốn chuyển
                    </p>
                    <div className="text-start">
                      <label className="text-default-300 mb-2 block text-sm">Chọn Token</label>
                      <select
                        className="w-full rounded-lg bg-default-950/40 border border-default-200/20 p-2.5 
                        text-default-300 appearance-none cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-blue-500/40
                        hover:border-default-200/40 transition-colors"
                        onChange={(e) => handleTokenSelect(e.target.value)}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23718096' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '12px'
                        }}
                      >
                        <option value="" className="bg-default-950 text-default-300">
                          Chọn token muốn chuyển
                        </option>
                        {userTokens.map((token) => (
                          <option 
                            key={token.mint} 
                            value={token.mint}
                            className="bg-default-950 text-default-300"
                          >
                            {token.name || token.symbol} - Số dư: {token.balance}
                          </option>
                        ))}
                      </select>

                      {selectedTokenInfo && (
                        <div className="mt-4 p-4 rounded-lg bg-default-900/40 border border-default-200/20">
                          <div className="mb-4 text-center">
                            {selectedTokenInfo.image ? (
                              <img 
                                src={selectedTokenInfo.image}
                                alt={selectedTokenInfo.name}
                                className="mx-auto h-24 w-24 rounded-full border-2 border-blue-500/40 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "assets/images/default-token.png"; // Thêm ảnh default
                                }}
                              />
                            ) : (
                              <div className="mx-auto h-24 w-24 rounded-full border-2 border-default-200/40 flex items-center justify-center bg-default-900/60">
                                <span className="text-default-300">Không có ảnh</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-default-300 space-y-2">
                            <p>
                              <span className="font-medium">Loại Token:</span>{" "}
                              {selectedTokenInfo.decimals === 0 ? "NFT" : "SPL Token"}
                            </p>
                            <p>
                              <span className="font-medium">Tên:</span>{" "}
                              {selectedTokenInfo.name || selectedTokenInfo.symbol}
                            </p>
                            {selectedTokenInfo.decimals === 0 ? (
                              <p>
                                <span className="font-medium">Số lượng:</span> 1 NFT
                              </p>
                            ) : (
                              <>
                                <p>
                                  <span className="font-medium">Số dư:</span>{" "}
                                  {Number(selectedTokenInfo.balance).toLocaleString()} tokens
                                </p>
                                <p>
                                  <span className="font-medium">Decimals:</span>{" "}
                                  {selectedTokenInfo.decimals}
                                </p>
                              </>
                            )}
                            <p>
                              <span className="font-medium">Địa chỉ Token:</span>{" "}
                              <span className="text-xs break-all">{selectedTokenInfo.mint}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      <InputView
                        name="Địa chỉ người nhận"
                        placeholder="Nhập địa chỉ ví người nhận"
                        clickhandle={(e) => handleInputChange("receiver", e.target.value)}
                      />
                      <InputView
                        name="Số lượng"
                        placeholder="Nhập số lượng token muốn chuyển"
                        clickhandle={(e) => handleInputChange("amount", e.target.value)}
                      />
                      <div className="mb-6 text-center">
                        <button
                          onClick={transferToken} // Sẽ implement sau
                          disabled={isLoading}
                          className={`bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span className="fw-bold">
                            {isLoading ? "Đang xử lý..." : "Chuyển Token"}
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
                  title="Chuyển Token Thành Công"
                  message="Token của bạn đã được chuyển thành công"
                />

                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                    </a>
                  </div>
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-8 text-2xl font-bold text-white">
                      Thông tin Chuyển Token
                    </h4>
                    
                    <div className="mb-8">
                      {transferredTokenInfo.tokenImage ? (
                        <img 
                          src={transferredTokenInfo.tokenImage} 
                          alt="token" 
                          className="mx-auto h-32 w-32 object-contain rounded-full border-2 border-blue-500"
                          onError={(e) => {
                            e.currentTarget.src = "assets/images/default-token.png";
                          }}
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
                        placeholder={transferredTokenInfo.tokenMint}
                      />
                      <InputView
                        name="Địa chỉ người nhận"
                        placeholder={transferredTokenInfo.receiver}
                      />
                      {transferredTokenInfo.decimals === 0 ? (
                        <p className="text-default-300 text-base font-medium leading-6 mt-4">
                          <span>NFT đã được chuyển thành công</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-default-300 text-base font-medium leading-6 mt-4">
                            <span>Số lượng đã chuyển: {transferredTokenInfo.amount}</span>
                          </p>
                          <p className="text-default-300 text-base font-medium leading-6 mt-2">
                            <span>Số dư còn lại: {transferredTokenInfo.balance.toLocaleString()} tokens</span>
                          </p>
                        </>
                      )}

                      <div className="mb-6 text-center space-y-4">
                        <a
                          href={`https://explorer.solana.com/address/${transferredTokenInfo.tokenMint}?cluster=${networkConfiguration}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary-600/90 hover:bg-primary-600 group inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                        >
                          <span className="fw-bold">
                            Xem trên Solana Explorer
                          </span>
                        </a>

                        <button
                          onClick={() => setOpenTransferModal(false)}
                          className="bg-default-500/90 hover:bg-default-500 group inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                        >
                          <span className="fw-bold">Đóng</span>
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
