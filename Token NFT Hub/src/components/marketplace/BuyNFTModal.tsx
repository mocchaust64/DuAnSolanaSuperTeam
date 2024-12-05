import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../../hooks/useAnchorProgram';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { notify } from '../../utils/notifications';
import { ComputeBudgetProgram } from '@solana/web3.js';
import { ListedNFT, NFT, NFTCreator } from '@/types/nft';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { useRouter } from "next/router";
import * as BufferLayout from 'buffer-layout';
import * as anchor from '@coral-xyz/anchor';

interface BuyNFTModalProps {
    nft: ListedNFT;
    onClose: () => void;
    onSuccess?: () => void;
}

// Tạo layout cho dữ liệu truyền vào instruction
const buyNftLayout = BufferLayout.struct([
  BufferLayout.u16('royaltyPercentage'),
]); 

// Sửa lại hàm tạo discriminator
const createInstructionDiscriminator = (name: string): Buffer => {
  return Buffer.from(anchor.utils.sha256.hash(`${name}`).slice(0, 8));
};

export const BuyNFTModal: FC<BuyNFTModalProps> = ({ nft, onClose, onSuccess }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useAnchorProgram();
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const router = useRouter();
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(0);

  // Thêm useEffect để lấy metadata của NFT
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            new PublicKey(nft.mint).toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        const metadataAccount = await connection.getAccountInfo(metadataPDA);
        if (metadataAccount) {
          const [metadata] = Metadata.fromAccountInfo(metadataAccount);
          setMetadata(metadata);
          setRoyaltyPercentage(metadata.data.sellerFeeBasisPoints);
        }
      } catch (error) {
        console.error("Lỗi khi lấy metadata:", error);
      }
    };

    fetchMetadata();
  }, [nft.mint, connection]);

  const handleBuyNFT = async () => {
    if (!publicKey || !program || !signTransaction) return;

    try {
      setIsProcessing(true);

      // Kiểm tra người mua không phải người bán
      if (nft.seller === publicKey.toString()) {
        notify({
          type: "error",
message: "Không thể thực hiện",
          description: "Bạn không thể mua NFT của chính mình"
        });
        return;
      }

      const [marketplaceConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace_v2")],
        program.programId
      );

      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing_v2"), new PublicKey(nft.mint).toBuffer()],
        program.programId
      );

      // Lấy các token accounts
      const sellerTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(nft.mint),
        new PublicKey(nft.seller)
      );

      const escrowTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(nft.mint),
        listingPDA,
        true
      );

      const buyerTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(nft.mint),
        publicKey
      );

      // Tạo transaction
      const transaction = new Transaction();

      // Thêm instruction tạo buyer token account nếu chưa tồn tại
      const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount);
      if (!buyerTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            buyerTokenAccount,
            publicKey,
            new PublicKey(nft.mint)
          )
        );
      }

      // Thêm compute budget instruction
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })
      );

      // Encode dữ liệu với royalty percentage
      const dataLayout = BufferLayout.struct([
        BufferLayout.u16('royaltyPercentage'),
      ]);

      const data = Buffer.alloc(8 + dataLayout.span);
      Buffer.from([96, 0, 28, 190, 49, 107, 83, 222]).copy(data, 0);
      dataLayout.encode(
        { royaltyPercentage: metadata?.data?.sellerFeeBasisPoints || 0 }, 
        data, 
        8
      );  

      // Tính toán phí và tổng số tiền
      const listingPrice = nft.price;
      const feePercentage = 200; // 2%
      const royaltyPercentage = metadata?.data?.sellerFeeBasisPoints || 0;

      // Tính phí marketplace (2%)
      const feeAmount = (listingPrice * feePercentage) / 10000;

      // Tính royalty
      const royaltyAmount = (listingPrice * royaltyPercentage) / 10000;

      // Tính tổng số tiền
      const totalAmount = listingPrice + feeAmount + royaltyAmount;

      // Tính số lamports cần thiết cho transaction
      const lamportsNeeded = totalAmount * LAMPORTS_PER_SOL;

      console.log("Transaction details:", {
        listingPrice: `${listingPrice} SOL`,
        feeAmount: `${feeAmount} SOL`,
        royaltyAmount: `${royaltyAmount} SOL`,
        calculatedTotal: `${totalAmount} SOL`,
        lamportsNeeded: `${lamportsNeeded} lamports`
      });

      // Lấy số dư hiện tại của ví
      const balance = await connection.getBalance(publicKey);
      console.log("Wallet balance:", {
balance: `${balance / LAMPORTS_PER_SOL} SOL`,
        balanceInLamports: balance
      });

      // Thêm buy instruction
      transaction.add(
        new TransactionInstruction({
          programId: program.programId,
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: new PublicKey(nft.seller), isSigner: false, isWritable: true },
            { pubkey: marketplaceConfig, isSigner: false, isWritable: true },
            { pubkey: listingPDA, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(nft.mint), isSigner: false, isWritable: true },
            { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
            { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
            { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
            { pubkey: new PublicKey("8kjmpRqSCGHHvcD9DabFjZqsNWKLR86Rfaxwui3z7APi"), isSigner: false, isWritable: true },
            { pubkey: metadata?.data?.creators?.[0]?.address ? new PublicKey(metadata.data.creators[0].address) : publicKey, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          ],
          data: data,
        })
      );

      // Gửi transaction
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      
      await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });

      notify({
        type: "success",
        message: "Giao dịch thành công",
        description: "Bạn đã mua NFT thành công!",
        txid: txid
      });

      // Comment tất cả các callback
      if (onSuccess) onSuccess();
      router.push("/marketplace/my-nfts");

    } catch (error) {
      console.error("Lỗi khi mua NFT:", error);
      notify({
        type: "error",
        message: "Lỗi khi mua NFT",
        description: error.message
      });
    } finally {
      setIsProcessing(false);
 
      onClose();
    }
  };

  // Tính toán royalty percentage
  const getRoyaltyPercentage = () => {
    if (metadata?.data?.sellerFeeBasisPoints) {
      return metadata.data.sellerFeeBasisPoints / 100; // Chuyển đổi basis points sang phần trăm
    }
    return 0;
  };

  // Thêm hàm tính toán giá
  const calculatePrices = () => {
    const listingPrice = nft.price;
const marketplaceFee = (listingPrice * 200) / 10000; // 2% = 200 basis points
    const royaltyFee = (listingPrice * (metadata?.data?.sellerFeeBasisPoints || 0)) / 10000;
    
    return {
      listingPrice,
      marketplaceFee,
      royaltyFee,
      total: listingPrice + marketplaceFee + royaltyFee
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900/90 rounded-2xl p-6 max-w-md w-full border border-purple-500/20 shadow-xl shadow-purple-500/10">
        {/* Header */}
        <div className="border-b border-gray-700 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Xác nhận mua NFT</h2>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* NFT Info */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tên NFT</span>
              <span className="text-white font-medium">{nft.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Giá listing</span>
              <span className="text-white font-medium">{nft.price} SOL</span>
            </div>
          </div>

          {/* Fees Info */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Phí marketplace</span>
              <span className="text-purple-400 font-medium">2%</span>
            </div>

            {/* Royalties từ metadata */}
            <div className="flex justify-between items-center border-t border-gray-700 pt-2">
              <span className="text-gray-400">Royalty</span>
              <span className="text-purple-400 font-medium">
                {getRoyaltyPercentage()}%
              </span>
            </div>

            {/* Creators */}
            {metadata?.data?.creators && (
              <div className="space-y-2 border-t border-gray-700 pt-2">
                <span className="text-gray-400">Phân phối royalty:</span>
                <div className="flex flex-col gap-1">
                  {metadata.data.creators.map((creator: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {creator.address.toString().slice(0,4)}...
                        {creator.address.toString().slice(-4)}
                      </span>
                      <span className="text-purple-400">
                        {creator.share}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Total Info */}
<div className="bg-purple-500/10 rounded-xl p-4">
            <div className="text-sm text-purple-300">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Chi tiết thanh toán:</span>
              </div>
              {(() => {
                const prices = calculatePrices();
                return (
                  <ul className="list-none space-y-2">
                    <li className="flex justify-between">
                      <span>Giá listing:</span>
                      <span>{prices.listingPrice} SOL</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Phí marketplace (2%):</span>
                      <span>+ {prices.marketplaceFee.toFixed(4)} SOL</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Royalty ({(metadata?.data?.sellerFeeBasisPoints || 0) / 100}%):</span>
                      <span>+ {prices.royaltyFee.toFixed(4)} SOL</span>
                    </li>
                    <li className="flex justify-between font-semibold text-white border-t border-purple-500/20 pt-2 mt-2">
                      <span>Tổng thanh toán:</span>
                      <span>{prices.total.toFixed(4)} SOL</span>
                    </li>
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8 border-t border-gray-700 pt-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
          >
            Hủy
          </button>
          <button
            onClick={handleBuyNFT}
            disabled={isProcessing}
            className={`
              px-6 py-2.5 rounded-lg bg-purple-600 text-white
              ${!isProcessing && 'hover:bg-purple-700 active:bg-purple-800'}
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center min-w-[120px]
            `}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý
              </>
            ) : (
              'Xác nhận mua'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};