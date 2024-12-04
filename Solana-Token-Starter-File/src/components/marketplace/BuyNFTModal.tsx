import { FC, useState } from 'react';
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



interface BuyNFTModalProps {
    nft: ListedNFT;
    onClose: () => void;
    onSuccess?: () => void;
  }
  
export const BuyNFTModal: FC<BuyNFTModalProps> = ({ nft, onClose, onSuccess }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useAnchorProgram();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Thêm hàm tính royalty
  const calculateRoyalties = (price: number, creators: NFTCreator[]) => {
    return creators.map(creator => ({
      address: new PublicKey(creator.address),
      amount: new BN((price * creator.share / 100 * LAMPORTS_PER_SOL).toString())
    }));
  };

  const handleBuyNFT = async () => {
    if (!publicKey || !program || !signTransaction) return;

    try {
      setIsProcessing(true);

      // Convert mint address string to PublicKey
      const mintPubkey = new PublicKey(nft.mint);

      // Lấy MarketplaceConfig PDA
      const [marketplaceConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace")],
        program.programId
      );

      // Lấy thông tin marketplace config
      const marketplaceConfigAccount = await program.account.marketplaceConfig.fetch(
        marketplaceConfigPDA
      );

      // Lấy metadata PDA theo cách thủ công
      const [nftMetadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintPubkey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Lấy metadata account data
      const metadataAccount = await connection.getAccountInfo(nftMetadataPDA);
      if (!metadataAccount) {
        throw new Error("Không tìm thấy metadata account");
      }

      // Parse metadata data
      const [metadata] = Metadata.fromAccountInfo(metadataAccount);

      // Tính toán phí
      const priceInSol = parseFloat(nft.price.toString());
      if (isNaN(priceInSol)) {
        throw new Error("Giá NFT không hợp lệ");
      }

      // Chuyển đổi sang lamports và tạo BN
      const lamports = Math.floor(priceInSol * LAMPORTS_PER_SOL);
      const priceInLamports = new BN(lamports.toString());

      console.log("Debug price:", {
        original: nft.price,
        inSol: priceInSol,
        lamports: lamports,
        inLamports: priceInLamports.toString()
      });

      // Marketplace fee (chuyển đổi sang string)
      const feePercentage = new BN(marketplaceConfigAccount.feePercentage.toString());
      const feeAmount = priceInLamports.mul(feePercentage).div(new BN('10000'));

      // Royalty fee (chuyển đổi sang string)
      const sellerFeeBasisPoints = new BN((metadata.data.sellerFeeBasisPoints || 0).toString());
      const royaltyAmount = priceInLamports.mul(sellerFeeBasisPoints).div(new BN('10000'));

      // Tổng số tiền cần thanh toán
      const totalAmount = priceInLamports.add(feeAmount).add(royaltyAmount);

      // Log chi tiết để debug
      console.log("Chi tiết thanh toán:");
      console.log(`- Giá NFT: ${priceInLamports.toString()} lamports (${priceInSol} SOL)`);
      console.log(`- Phí marketplace (${feePercentage.toNumber()/100}%): ${feeAmount.toString()} lamports (${feeAmount.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL)`);
      console.log(`- Royalty (${sellerFeeBasisPoints.toNumber()/100}%): ${royaltyAmount.toString()} lamports (${royaltyAmount.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL)`);
      console.log(`Tổng cộng: ${totalAmount.toString()} lamports (${totalAmount.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL)`);

      // Check không được mua NFT của chính mình
      if (nft.seller === publicKey.toString()) {
        notify({
          type: "error",
          message: "Không thể thực hiện",
          description: "Bạn không thể mua NFT của chính mình"
        });
        onClose();
        return;
      }

      // Kiểm tra số dư
      const balance = await connection.getBalance(publicKey);
      console.log("Số dư hiện tại:", balance, "lamports");

      if (balance < totalAmount.toNumber()) {
        notify({
          type: "error",
          message: "Số dư không đủ",
          description: `Bạn cần ${(totalAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL để mua NFT này`
        });
        onClose();
        return;
      }

      // Lấy PDA cho marketplace config
      const [marketplaceConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace")],
        program.programId
      );

      // Lấy PDA cho listing account
      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), new PublicKey(nft.mint).toBuffer()],
        program.programId
      );

      // Tạo buyer token account nếu chưa có
      const buyerTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(nft.mint),
        publicKey
      );

      // Kiểm tra và tạo buyer token account nếu cần
      const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount);
      if (!buyerTokenAccountInfo) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey,
          buyerTokenAccount,
          publicKey,
          new PublicKey(nft.mint)
        );
        const tx = new Transaction().add(createAtaIx);
        const latestBlockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = publicKey;
        
        const signedTx = await signTransaction(tx);
        await connection.sendRawTransaction(signedTx.serialize());
        // Đợi một chút để account được tạo
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

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

      // Lấy metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(nft.mint).toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Lấy master edition PDA
      const [masterEditionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(nft.mint).toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Tạo các instructions cho transaction
      const instructions: TransactionInstruction[] = [];

      // Thêm instruction chuyển SOL cho seller
      const transferToSellerIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(nft.seller),
        lamports: priceInLamports.toNumber()
      });
      instructions.push(transferToSellerIx);

      // Thêm instruction chuyển phí marketplace
      if (feeAmount.toNumber() > 0) {
        const transferFeeIx = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey("8kjmpRqSCGHHvcD9DabFjZqsNWKLR86Rfaxwui3z7APi"), // treasury wallet
          lamports: feeAmount.toNumber()
        });
        instructions.push(transferFeeIx);
      }

      // Thêm instruction chuyển royalty nếu có
      if (royaltyAmount.toNumber() > 0 && nft.creators?.[0]?.address) {
        const transferRoyaltyIx = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(nft.creators[0].address),
          lamports: royaltyAmount.toNumber()
        });
        instructions.push(transferRoyaltyIx);
      }

      // Tạo instruction data buffer cho buyNft với discriminator đúng từ IDL
      const discriminator = [96, 0, 28, 190, 49, 107, 83, 222]; // buyNft discriminator từ IDL
      const buyNftInstructionData = Buffer.from(discriminator);

      // Thêm instruction mua NFT
      const buyIx = new TransactionInstruction({
        programId: program.programId,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true }, // buyer
          { pubkey: new PublicKey(nft.seller), isSigner: false, isWritable: true }, // seller
          { pubkey: marketplaceConfig, isSigner: false, isWritable: true }, // config
          { pubkey: listingPDA, isSigner: false, isWritable: true }, // listingAccount
          { pubkey: new PublicKey(nft.mint), isSigner: false, isWritable: true }, // nftMint
          { pubkey: sellerTokenAccount, isSigner: false, isWritable: true }, // sellerTokenAccount
          { pubkey: escrowTokenAccount, isSigner: false, isWritable: true }, // escrowTokenAccount
          { pubkey: buyerTokenAccount, isSigner: false, isWritable: true }, // buyerTokenAccount
          { pubkey: new PublicKey("8kjmpRqSCGHHvcD9DabFjZqsNWKLR86Rfaxwui3z7APi"), isSigner: false, isWritable: true }, // treasuryWallet
          { pubkey: nft.creators?.[0]?.address ? new PublicKey(nft.creators[0].address) : publicKey, isSigner: false, isWritable: true }, // creatorWallet
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associatedTokenProgram
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        data: Buffer.from(discriminator) // Sử dụng discriminator từ IDL
      });
      instructions.push(buyIx);

      // Tạo transaction với compute budget và tất cả instructions
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000
      });

      const transaction = new Transaction()
        .add(modifyComputeUnits)
        .add(...instructions);

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      // Sign và gửi transaction
      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());

      console.log("Đang đợi xác nhận giao dịch...");

      // Đợi xác nhận với timeout
      const confirmation = await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        const error = confirmation.value.err;
        console.error("Chi tiết lỗi:", error);
        throw new Error(`Giao dịch thất bại: ${JSON.stringify(error)}`);
      }

      // Kiểm tra kết quả giao dịch
      const txResult = await connection.getTransaction(txid, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (!txResult?.meta) {
        throw new Error("Không thể lấy thông tin giao dịch");
      }

      console.log("Giao dịch thành công:", txid);
      console.log("Logs:", txResult.meta.logMessages);
      onClose();

      // Sau khi giao dịch thành công
      console.log("Giao dịch mua NFT thành công!");
      notify({
        type: "success",
        message: "Giao dịch thành công",
        description: "Bạn đã mua NFT thành công!",
        txid: txid
      });

      // Đợi một chút để các account được cập nhật
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Gọi callback onSuccess nếu có
      if (onSuccess) {
        onSuccess();
      }

      // Đóng modal
      onClose();

      // Chuyển về trang My NFTs với đường dẫn đúng
      router.push("/marketplace/my-nfts");

    } catch (error) {
      console.error("Lỗi khi mua NFT:", error);
      // Hiển thị thông báo lỗi cho người dùng
      alert(`Lỗi khi mua NFT: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800/50 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-white">Xác nhận mua NFT</h2>
        
        <div className="mb-4">
          <p className="text-gray-300">Tên: {nft.name}</p>
          <p className="text-gray-300">Giá: {nft.price} SOL</p>
          {nft.creators && nft.creators.length > 0 && (
            <div className="mt-2">
              <p className="text-gray-300">Royalties:</p>
              {nft.creators.map((creator, index) => (
                <p key={index} className="text-sm text-gray-400">
                  {creator.address.slice(0,4)}...{creator.address.slice(-4)}: {creator.share}%
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200"
            disabled={isProcessing}
          >
            Hủy
          </button>
          <button
            onClick={handleBuyNFT}
            disabled={isProcessing}
            className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Đang xử lý...' : 'Xác nhận mua'}
          </button>
        </div>
      </div>
    </div>
  );
};