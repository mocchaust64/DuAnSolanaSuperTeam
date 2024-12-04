import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction 
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { AnchorProvider } from '@project-serum/anchor';
import { notify } from '@/utils/notifications';

// Discriminator cho instruction delistNft (từ IDL)
const DELIST_NFT_DISCRIMINATOR = [91, 249, 165, 185, 22, 7, 119, 176];

export const delistNFT = async (
  connection: Connection,
  provider: AnchorProvider,
  programId: PublicKey,
  nftMint: PublicKey,
): Promise<string> => {
  try {
    const [listingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), nftMint.toBuffer()],
      programId
    );

    const ownerTokenAccount = getAssociatedTokenAddressSync(
      nftMint,
      provider.wallet.publicKey
    );

    const escrowTokenAccount = getAssociatedTokenAddressSync(
      nftMint,
      listingPDA,
      true
    );

    console.log('Delisting NFT:', {
      mint: nftMint.toBase58(),
      listing: listingPDA.toBase58(),
      owner: provider.wallet.publicKey.toBase58(),
      escrow: escrowTokenAccount.toBase58()
    });

    const data = Buffer.from([
      ...DELIST_NFT_DISCRIMINATOR,
    ]);

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
      data: data,
    });

    const transaction = new Transaction().add(delistInstruction);
    const signature = await provider.sendAndConfirm(transaction);

    notify({
      type: 'success',
      message: 'NFT delisted successfully!',
      txid: signature
    });

    return signature;

  } catch (error) {
    console.error('Error delisting NFT:', error);
    notify({
      type: 'error',
      message: 'Error Delisting NFT',
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
};
