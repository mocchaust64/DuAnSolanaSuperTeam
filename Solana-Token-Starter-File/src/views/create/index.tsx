import React, { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,

  ComputeBudgetProgram
} from "@solana/web3.js";
import {

  TOKEN_PROGRAM_ID,

  getAssociatedTokenAddress,

  createAssociatedTokenAccountInstruction,

} from "@solana/spl-token";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import axios from "axios";
import { notify } from "../../utils/notifications";
import { ClipLoader } from "react-spinners";
import { useNetworkConfiguration } from "@contexts/NetworkConfigurationProvider";
import { AiOutlineClose } from "react-icons/ai";
import CreateSVG from '@/components/SVG/CreateSVG';
import { InputView } from "../input";
import Branding from "../../components/Branding";
import NotificationList from "../../components/Notification";
import { getProgram } from "../../utils/program";
import { BN } from "@project-serum/anchor";
import { TokenData } from '../../utils/token';

// Environment variables
const PINATA_API_KEY = "bb931179bd2f614252de";
const PINATA_SECRET_KEY = "212e21d04c9998b7e21a4b74f0aac994ceefad203901e9e3c879aaa6c43269cc";


interface CreateViewProps {
  setOpenCreateModal: (value: boolean) => void;
  
}

export const CreateView: FC<CreateViewProps> = ({ setOpenCreateModal }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { networkConfiguration } = useNetworkConfiguration();

  
  const [tokenMintAddress, setTokenMintAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<TokenData>({
    name: "",
    symbol: "",
    description: "",
    image: "",
    amount: "",
    decimals: 9,
  });
  const [pinataFile, setPinataFile] = useState<File | null>(null);

  const handleFormFieldChange = (
    fieldName: keyof TokenData,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setToken({ ...token, [fieldName]: e.target.value });
  };

  const calculateTokenAmount = (amount: string, decimals: number): BN => {
    try {
      // Loại bỏ dấu phẩy và chuyển dấu chấm
      const cleanAmount = amount.replace(/,/g, '').replace(/\s/g, '');
      
      // Tách phần nguyên và phần thập phân
      const [integerPart = '0', decimalPart = ''] = cleanAmount.split('.');
      
      // Xử lý phần thập phân theo decimals
      const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
      
      // Ghép số lại thành một chuỗi không có dấu chấm
      const fullAmount = integerPart + paddedDecimal;
      
      // Loại bỏ các số 0 ở đầu
      const cleanNumber = fullAmount.replace(/^0+/, '') || '0';
      
      return new BN(cleanNumber);
    } catch (error) {
      throw new Error("Số lượng token không hợp lệ");
    }
  };

  const validateTokenData = (token: TokenData): boolean => {
    if (!token.name || !token.symbol || !token.amount || !token.image) {
      notify({ type: "error", message: "Vui lòng điền tất cả các trường bắt buộc" });
      return false;
    }

    try {
      const parsedAmount = parseFloat(token.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount phải là số dương");
      }
      
      // Tính toán số lượng thực với decimals
      const actualAmount = new BN(token.amount).mul(new BN(10).pow(new BN(token.decimals)));
      
      // Kiểm tra giới hạn u64: 2^64 - 1
      const U64_MAX = new BN("18446744073709551615"); // 2^64 - 1
      
      if (actualAmount.gt(U64_MAX)) {
        notify({ type: "error", message: "Số lượng token vượt quá giới hạn u64" });
        return false;
      }

      // Cập nhật amount
      token.amount = actualAmount.toString();
    } catch (error: any) {
      notify({ type: "error", message: error.message });
      return false;
    }

    return true;
  };

  const uploadImagePinata = async (): Promise<string | null> => {
    if (!pinataFile) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', pinataFile);
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 0,
      }));

      const response = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
          "Content-Type": "multipart/form-data"
        },
      });

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      return ipfsUrl;
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      notify({ type: "error", message: "Upload ảnh thất bại" });
      return null;
    }
  };

  // Add image processing function
const processImage = async (file: File): Promise<{ 
  displayFile: File, 
  uploadFile: File 
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvases for both display and upload versions
        const displayCanvas = document.createElement('canvas');
        const uploadCanvas = document.createElement('canvas');

        // Display version - fit into 400x400 maintaining aspect ratio
        const maxDisplaySize = 400;
        let displayWidth = img.width;
        let displayHeight = img.height;
        if (displayWidth > displayHeight) {
          if (displayWidth > maxDisplaySize) {
            displayHeight *= maxDisplaySize / displayWidth;
            displayWidth = maxDisplaySize;
          }
        } else {
          if (displayHeight > maxDisplaySize) {
            displayWidth *= maxDisplaySize / displayHeight;
            displayHeight = maxDisplaySize;
          }
        }

        // Upload version - 800x800 for Pinata
        const uploadSize = 800;
        
        // Set canvas sizes
        displayCanvas.width = displayWidth;
        displayCanvas.height = displayHeight;
        uploadCanvas.width = uploadSize;
        uploadCanvas.height = uploadSize;

        // Draw images
        const displayCtx = displayCanvas.getContext('2d');
        const uploadCtx = uploadCanvas.getContext('2d');
        
        displayCtx?.drawImage(img, 0, 0, displayWidth, displayHeight);
        uploadCtx?.drawImage(img, 0, 0, uploadSize, uploadSize);

        // Convert to files
        displayCanvas.toBlob((displayBlob) => {
          uploadCanvas.toBlob((uploadBlob) => {
            if (displayBlob && uploadBlob) {
              resolve({
                displayFile: new File([displayBlob], file.name, { type: 'image/png' }),
                uploadFile: new File([uploadBlob], file.name, { type: 'image/png' })
              });
            }
          }, 'image/png');
        }, 'image/png');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Update handleImageChange
const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      const { displayFile, uploadFile } = await processImage(file);
      
      // Set preview image
      setToken(prev => ({
        ...prev,
        image: URL.createObjectURL(displayFile)
      }));

      // Save upload file for later use
      setPinataFile(uploadFile);
      
    } catch (error) {
      console.error('Error processing image:', error);
      notify({ type: 'error', message: 'Error processing image' });
    }
  }
};

  const uploadMetadata = async (token: TokenData): Promise<string> => {
    try {
      const metadata = {
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        image: token.image,
        attributes: [],
        properties: {
          files: [
            {
              uri: token.image,
              type: "image/png"
            }
          ],
          category: "image",
          creators: [
            {
              address: publicKey.toString(),
              share: 100
            }
          ]
        }
      };

      const response = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: metadata,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
          "Content-Type": "application/json"
        },
      });

      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      return metadataUrl;
    } catch (error) {
      console.error("Lỗi tạo metadata:", error);
      throw new Error("Tạo metadata thất bại");
    }
  };

  const createToken = useCallback(async (token: TokenData) => {
    try {
      // Validate và kiểm tra kết nối ví
      if (!publicKey) {
        notify({ type: "error", message: "Vui lòng kết nối ví" });
        return;
      }

      setIsLoading(true);

      // Upload metadata lên Pinata trước
      const metadataUrl = await uploadMetadata(token);
      token.uri = metadataUrl; // Cập nhật URI cho token

      // Tiếp tục tạo token với URI mới
      const transaction = new Transaction();
      const program = getProgram(connection, publicKey);
      const mintKeypair = Keypair.generate();

      // Thêm compute budget
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      transaction.add(modifyComputeUnits, addPriorityFee);

      // Tạo token mint instruction
      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const createMintIx = await program.methods
        .createTokenMint(
          token.decimals,
          token.name,
          token.symbol,
          token.uri || ""
        )
        .accounts({
          payer: publicKey,
          mintAccount: mintKeypair.publicKey,
          metadataAccount: metadataAddress,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        })
        .instruction();

      // Tạo token account cho người tạo
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      // Tạo ATA instruction
      const createATAIx = createAssociatedTokenAccountInstruction(
        publicKey,
        tokenAccount,
        publicKey,
        mintKeypair.publicKey
      );

      // Thêm mint instruction
      const mintIx = await program.methods
        .mintTo(calculateTokenAmount(token.amount, token.decimals))
        .accounts({
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          authority: publicKey,
        })
        .instruction();

      transaction.add(createMintIx, createATAIx, mintIx);

      // Gửi và xác nhận transaction
      const signature = await sendAndConfirmTransaction(transaction, mintKeypair);

      // Sau khi tạo token thành công
      const tokenMint = mintKeypair.publicKey.toString();

      try {
        // Thêm token vào ví
        await window.solana.request({
          method: "wallet_watchAsset",
          params: {
            type: "SPL",
            options: {
              mint: tokenMint,
              symbol: token.symbol,
              decimals: token.decimals,
              image: token.image
            },
          }
        });
      } catch (error) {
        console.error("Lỗi thêm token vào ví:", error);
        // Bỏ qua lỗi này vì token đã được tạo thành công
      }

      // Lưu địa chỉ token để hiển thị form thành công
      setTokenMintAddress(tokenMint);

      notify({
        type: "success",
        message: "Token đã được tạo thành công!",
        txid: signature,
      });

      // Tắt loading sau khi hoàn tất
      setIsLoading(false);

    } catch (error) {
      handleError(error);
      setIsLoading(false); // Tắt loading nếu có lỗi xảy ra
    }
  }, [connection, publicKey]);

  const sendAndConfirmTransaction = async (
    transaction: Transaction,
    mintKeypair: Keypair
  ): Promise<string> => {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    transaction.partialSign(mintKeypair);

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

    return signature;
  }

  const handleError = (error: any) => {
    let errorMessage = "Tạo token thất bại";

    if (error.message.includes('Transaction simulation failed')) {
      errorMessage = "Giao dịch thất bại trong quá trình mô phỏng";
    } else if (error.message.includes('Blockhash not found')) {
      errorMessage = "Blockhash không hợp lệ, vui lòng thử lại";
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = "Không đủ SOL để tạo token";
    }

    notify({ type: "error", message: errorMessage });
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <NotificationList />
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <div className="mt-4 text-white font-medium">Đang Tạo Token...</div>
          </div>
        </div>
      )}

      {!tokenMintAddress ? (
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <img 
                  src="/assets/images/logo1.png"
                  alt="Logo"
                  className="h-16 w-16 transform hover:scale-110 transition-transform duration-300"
                />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 
                  bg-clip-text text-transparent">
                  Tạo Token Của Bạn
                </h2>
              </div>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Phát hành token của riêng bạn trên blockchain Solana chỉ với vài cú nhấp chuột
              </p>
            </div>

            {/* Main Content */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 mx-auto max-w-5xl overflow-hidden rounded-2xl 
              backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(120,119,198,0.1)]">
              <div className="grid gap-10 lg:grid-cols-2">
                {/* Left Column */}
                <div className="relative p-8 lg:p-10 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                  <div className="absolute inset-0 bg-grid-white/[0.02]" />
                  
                  <h3 className="relative text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 
                    bg-clip-text text-transparent mb-6">
                    Tạo Token Solana
                  </h3>
                  
                  <p className="relative text-gray-400 mb-8">
                    Phát hành token của riêng bạn trên blockchain Solana với thương hiệu và thông số tùy chỉnh
                  </p>

                  <div className="upload relative w-full aspect-square max-w-md mx-auto rounded-2xl 
                    bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 
                    border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    {token.image ? (
                      <div className="relative group h-full flex items-center justify-center">
                        <img 
                          src={token.image} 
                          alt="token" 
                          className="max-w-[200px] max-h-[200px] w-auto h-auto object-contain rounded-xl 
                            transform transition-transform duration-300 group-hover:scale-[1.02]" 
                        />
                        <button
                          onClick={() => setToken({...token, image: ""})}
                          className="absolute top-3 right-3 p-2.5 rounded-full 
                            bg-red-500/80 hover:bg-red-500 
                            transition-all duration-300 
                            opacity-0 group-hover:opacity-100
                            transform group-hover:scale-110"
                        >
                          <AiOutlineClose className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label 
                        htmlFor="file" 
                        className="flex flex-col items-center justify-center h-full
                          cursor-pointer rounded-xl border-2 border-dashed border-gray-600
                          hover:border-purple-500/50 transition-all duration-300
                          group"
                      >
                        <div className="text-center p-8">
                          <CreateSVG className="w-20 h-20 mx-auto mb-6 text-purple-500/40 
                            group-hover:text-purple-500/60 transition-colors duration-300" />
                          <h3 className="text-lg font-semibold text-white/80 mb-2">
                            Tải Lên Hình Ảnh Token
                          </h3>
                          <p className="text-gray-400 text-sm mb-1">
                            Nhấp hoặc kéo hình ảnh để tải lên
                          </p>
                          <p className="text-gray-500 text-xs">
                            SVG, PNG, JPG (tối đa 800x800px)
                          </p>
                        </div>
                        <input 
                          type="file" 
                          id="file" 
                          className="hidden" 
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="p-8 lg:p-10">
  {/* Header with logo and close button */}
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <img 
        src="/assets/images/logo1.png"
        alt="Logo"
        className="h-12 w-12 transform hover:scale-110 transition-transform duration-300"
      />
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 
        bg-clip-text text-transparent">
        Create Solana Token
      </h3>
    </div>
    
    <button
      onClick={() => setOpenCreateModal(false)}
      className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 
        transition-colors duration-300 group"
    >
      <AiOutlineClose className="w-6 h-6 text-white/70 group-hover:text-red-500
        transform group-hover:rotate-90 transition-all duration-300" />
    </button>
  </div>

  <div className="space-y-6">
    <InputView
      name="Tên Token"
      placeholder="Nhập tên token"
      clickhandle={(e) => handleFormFieldChange("name", e)}
    />
    <InputView
      name="Ký Hiệu"
      placeholder="Nhập ký hiệu token (ví dụ: SOL)"
      clickhandle={(e) => handleFormFieldChange("symbol", e)}
    />
    <InputView
      name="Tổng Cung"
      placeholder="Nhập tổng cung"
      clickhandle={(e) => handleFormFieldChange("amount", e)}
    />

    <textarea
      rows={6}
      onChange={(e) => handleFormFieldChange("description", e)}
      className="w-full rounded-xl bg-white/5 border border-white/10 p-4
        text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 
        focus:ring-purple-500/20 transition-all duration-300"
      placeholder="Mô tả token của bạn..."
    />

    <button
      onClick={() => createToken(token)}
      disabled={isLoading}
      className="relative w-full py-4 rounded-xl font-bold text-lg
        bg-gradient-to-r from-purple-600 to-blue-600
        hover:from-purple-500 hover:to-blue-500
        transform hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
        text-white shadow-lg hover:shadow-purple-500/25"
    >
      Tạo Token
    </button>

    <div className="text-center pt-4">
      <button
        onClick={() => setOpenCreateModal(false)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 
          transition-colors duration-300"
      >
        <AiOutlineClose className="w-6 h-6 text-white" />
      </button>
    </div>
  </div>
  {/* Token Creation Guide */}
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
                  title="Xây dựng Token Solana của bạn"
                  message="Hãy thử tạo token Solana đầu tiên của bạn."
                />

                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                    </a>
                  </div>

                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-4 text-2xl font-bold text-white">
                      Liên kết đến token mới của bạn
                    </h4>
                    <p className="text-default-300 mx-auto mb-5 max-w-sm">
                      Token Solana của bạn đã được tạo thành công, hãy kiểm tra ngay trên explorer
                    </p>

                    <div className="flex items-start justify-center">
                      <img
                        src={token.image || "assets/images/logo11.png"}
                        alt=""
                        className="h-40"
                      />
                    </div>

                    <div className="mt-5 w-full text-center">
                      <p className="text-default-300 text-base font-medium leading-6">
                        <InputView
                          name="Địa chỉ Token"
                          placeholder={tokenMintAddress}
                        />
                        <span
                          className="cursor-pointer"
                          onClick={() => navigator.clipboard.writeText(tokenMintAddress)}
                        >
                          Sao chép
                        </span>
                      </p>

                      <p className="text-default-300 text-base font-medium leading-6 mt-4">
                        <span>Mô tả: {token.description || "Chưa có mô tả"}</span>
                      </p>

                      <div className="mb-6 text-center">
                        <a
                          href={`https://explorer.solana.com/address/${tokenMintAddress}?cluster=${networkConfiguration}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                        >
                          <span className="fw-bold">
                            Xem Trên Solana Explorer
                          </span>
                        </a>
                      </div>
                      <ul className="flex flex-wrap items-center justify-center gap-2">
                        <li>
                          <a
                            onClick={() => setOpenCreateModal(false)}
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

export default CreateView;