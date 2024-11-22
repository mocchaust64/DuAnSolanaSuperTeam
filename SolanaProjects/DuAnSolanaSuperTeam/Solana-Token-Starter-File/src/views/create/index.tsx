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
import CreateSVG from "../../components/SVG/CreateSVG";
import { InputView } from "../input";
import Branding from "../../components/Branding";
import NotificationList from "../../components/Notification";
import { getProgram } from "../../utils/program";
import { BN } from "@project-serum/anchor";
import { TokenData } from '../../utils/token';

// Environment variables
const PINATA_API_KEY = "49d03dd184ece15831f8";
const PINATA_SECRET_KEY = "1f57f4848817f0a46c3c75bcd41eddef3d1f461c3ee8f935b7a643cf64d6bcc8";


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

  const uploadImagePinata = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);

      // Upload ảnh lên Pinata và lấy URL
      const imageUrl = await uploadImagePinata(file);
      if (imageUrl) {
        setToken(prev => ({
          ...prev,
          image: imageUrl // Lưu URL thay vì base64
        }));
      }
    } catch (error) {
      console.error("Lỗi xử lý ảnh:", error);
      notify({ type: "error", message: "Xử lý ảnh thất bại" });
    } finally {
      setIsLoading(false);
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
        <div className="absolute top-0 left-0 z-50 flex h-screen w-full items-center justify-center bg-black/[.3] backdrop-blur-[10px]">
          <ClipLoader />
        </div>
      )}
      {!tokenMintAddress ? (
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
              <div className="grid gap-10 lg:grid-cols-2">
                <div className="ps-4 hidden py-4 pt-10 lg:block">
                  <div className="upload relative w-full overflow-hidden rounded-xl">
                    {token.image ? (
                      <img src={token.image} alt="token" className="w-2/5" />
                    ) : (
                      <label htmlFor="file" className="custum-file-upload">
                        <div className="icon">
                          <CreateSVG />
                        </div>
                        <div className="text">
                          <span>Nhấn để tải lên hình ảnh</span>
                        </div>
                        <input type="file" id="file" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>

                  <textarea
                    rows={6}
                    onChange={(e) => handleFormFieldChange("description", e)}
                    className="border-default-200 relative mt-48 block w-full rounded border-white/10 bg-transparent py-1.5 px-3 text-white/80 focus:border-white/25 focus:ring-transparent"
                    placeholder="Mô tả về token của bạn"
                  ></textarea>
                </div>

                <div className="lg:ps-0 flex flex-col p-10" >
                  <div className="pb-6 my-auto">
                    <h4 className="mb-4 text-2xl font-bold text-white">
                       Tạo Token Solana
                    </h4>
                    <p className="text-default-300 mb-8 max-w-sm">
                      Vui lòng cung cấp tất cả thông tin về token của bạn
                    </p>
                    <div className="text-start">
                      <InputView
                        name="Tên"
                        placeholder="tên"
                        clickhandle={(e) => handleFormFieldChange("name", e)}
                      />
                      <InputView
                        name="Ký hiệu"
                        placeholder="ký hiệu"
                        clickhandle={(e) => handleFormFieldChange("symbol", e)}
                      />
                      <InputView
                        name="Số lượng"
                        placeholder="số lượng"
                        clickhandle={(e) => handleFormFieldChange("amount", e)}
                      />
                      <div className="mb-6 text-center">
                        <button
                          onClick={() => createToken(token)}
                          className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                          type="submit"
                        >
                          <span className="fw-bold">Tạo Token</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
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
                            Xem trên Solana
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