import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Program } from "@coral-xyz/anchor";
import { BN } from 'bn.js';

export interface NFTMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: {
    address: anchor.web3.PublicKey;
    verified: boolean;
    share: number;
  }[];
}

export interface OffChainMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string | null;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  properties: {
    files: {
      uri: string;
      type: string;
    }[];
    category: string;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface FileType {
  uri: string;
  file_type: string;
}

export interface NFTProperties {
  files: FileType[];
  category: string;
}

export interface CreateCollectionAccounts {
  user: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  mintAuthority: anchor.web3.PublicKey;
  metadata: anchor.web3.PublicKey;
  masterEdition: anchor.web3.PublicKey;
  destination: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenProgram: anchor.web3.PublicKey;
  associatedTokenProgram: anchor.web3.PublicKey;
  tokenMetadataProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
}

export interface MintNFTAccounts {
  owner: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  mintAuthority: anchor.web3.PublicKey;
  metadata: anchor.web3.PublicKey;
  masterEdition: anchor.web3.PublicKey;
  destination: anchor.web3.PublicKey;
  collectionMint: anchor.web3.PublicKey;
  collectionMetadata: anchor.web3.PublicKey;
  collectionMasterEdition: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenProgram: anchor.web3.PublicKey;
  associatedTokenProgram: anchor.web3.PublicKey;
  tokenMetadataProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
}

export interface ListNftAccounts {
  owner: anchor.web3.PublicKey;
  listingAccount: anchor.web3.PublicKey;
  nftMint: anchor.web3.PublicKey;
  nftToken: anchor.web3.PublicKey;
  escrowTokenAccount: anchor.web3.PublicKey;
  marketplaceConfig: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenProgram: anchor.web3.PublicKey;
  associatedTokenProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
  authority: anchor.web3.PublicKey;
}

export interface MarketplaceAccounts {
  authority: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  treasuryWallet: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
}

export interface VerifyCollectionAccounts {
  authority: anchor.web3.PublicKey;
  metadata: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  mintAuthority: anchor.web3.PublicKey;
  collectionMint: anchor.web3.PublicKey;
  collectionMetadata: anchor.web3.PublicKey;
  collectionMasterEdition: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenMetadataProgram: anchor.web3.PublicKey;
  sysvarInstruction: anchor.web3.PublicKey;
}

export interface CreateCollectionInstructionAccounts {
  user: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  mint_authority: anchor.web3.PublicKey;
  metadata: anchor.web3.PublicKey;
  master_edition: anchor.web3.PublicKey;
  destination: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenProgram: anchor.web3.PublicKey;
  associatedTokenProgram: anchor.web3.PublicKey;
  tokenMetadataProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
}

export interface UpdateListingAccounts {
  seller: PublicKey;
  listingAccount: PublicKey;
  nftMint: PublicKey;
  escrowTokenAccount: PublicKey;
  marketplaceConfig: PublicKey;
}

export interface PauseMarketplaceAccounts {
  authority: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
}

export interface UnpauseMarketplaceAccounts {
  authority: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
}

// DelistNFT Account Interface
export interface DelistNftAccounts {
  owner: anchor.web3.PublicKey;
  listingAccount: anchor.web3.PublicKey;
  nftMint: anchor.web3.PublicKey;
  ownerTokenAccount: anchor.web3.PublicKey;
  escrowTokenAccount: anchor.web3.PublicKey;
  systemProgram: anchor.web3.PublicKey;
  tokenProgram: anchor.web3.PublicKey;
  associatedTokenProgram: anchor.web3.PublicKey;
  rent: anchor.web3.PublicKey;
}

// BuyNFT Account Interface
export interface BuyNftAccounts {
  buyer: PublicKey;
  seller: PublicKey;
  config: PublicKey;
  listingAccount: PublicKey;
  nftMint: PublicKey;
  sellerTokenAccount: PublicKey;
  escrowTokenAccount: PublicKey;
  buyerTokenAccount: PublicKey;
  treasuryWallet: PublicKey;
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  rent: PublicKey;
}

// UpdateMetadata Account Interface
export interface UpdateMetadataAccounts {
  authority: PublicKey;
  metadata: PublicKey;
  mint: PublicKey;
  tokenMetadataProgram: PublicKey;
}

// Helper functions
export const getMetadata = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

export const getMasterEdition = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from('edition')],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

export const createBuyNftAccounts = (
  program: Program,
  accounts: BuyNftAccounts
) => {
  return {
    buyer: accounts.buyer,
    seller: accounts.seller,
    config: accounts.config,
    listingAccount: accounts.listingAccount,
    nftMint: accounts.nftMint,
    sellerTokenAccount: accounts.sellerTokenAccount,
    escrowTokenAccount: accounts.escrowTokenAccount,
    buyerTokenAccount: accounts.buyerTokenAccount,
    treasuryWallet: accounts.treasuryWallet,
    systemProgram: accounts.systemProgram,
    tokenProgram: accounts.tokenProgram,
    associatedTokenProgram: accounts.associatedTokenProgram,
    rent: accounts.rent,
  };
};

export interface ListingAccount {
  seller: PublicKey;
  nftMint: PublicKey;
  price: BN;
  tokenAccount: PublicKey;
  escrowTokenAccount: PublicKey;
  createdAt: BN;
  expiresAt: BN | null;
  isActive: boolean;
  bump: number;
}

export const getListingPDA = (
  mint: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): [anchor.web3.PublicKey, number] => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), mint.toBuffer()],
    programId
  );
}; 