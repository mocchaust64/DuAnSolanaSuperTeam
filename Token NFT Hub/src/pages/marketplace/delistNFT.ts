import { AnchorProvider } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, SYSVAR_RENT_PUBKEY, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { notify } from '@/utils/notifications';

// Discriminator cho instruction delistNft từ IDL
const DELIST_NFT_IX_DISCM = [91, 249, 165, 185, 22, 7, 119, 176];

export const delistNFT = async (
  connection: Connection,
  provider: AnchorProvider,
  programId: PublicKey,
  nftMint: PublicKey,
): Promise<string> => {
  try {
    // Tìm listing PDA và bump
    const [listingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('listing_v2'), nftMint.toBuffer()],
      programId
    );

    // Tìm owner token account
    const ownerTokenAccount = getAssociatedTokenAddressSync(
      nftMint,
      provider.wallet.publicKey
    );

    // Tìm escrow token account
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      nftMint,
      listingPDA,
      true
    );

    console.log('Delisting NFT:', {
      mint: nftMint.toBase58(),
      listing: listingPDA.toBase58(),
      owner: provider.wallet.publicKey.toBase58(),
      ownerToken: ownerTokenAccount.toBase58(),
      escrow: escrowTokenAccount.toBase58()
    });

    const delistInstruction = new TransactionInstruction({
      programId: programId,
      keys: [
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: listingPDA, isSigner: false, isWritable: true },
        { pubkey: nftMint, isSigner: false, isWritable: false },
        { pubkey: ownerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(DELIST_NFT_IX_DISCM)
    });

    const transaction = new Transaction().add(delistInstruction);
    transaction.feePayer = provider.wallet.publicKey;
    
    const signature = await provider.sendAndConfirm(transaction, [], {
      commitment: 'confirmed'
    });

    return signature;

  } catch (error) {
    console.error('Error delisting NFT:', error);
    throw error;
  }
};

