// src/idl/nft_marketplace.ts
import { PublicKey } from '@solana/web3.js';
import { Idl } from '@project-serum/anchor';

export type Creator = {
  address: PublicKey;
  verified: boolean;
  share: number;
};

export type NFTMetadata = {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[];
};

export type ListingAccount = {
  seller: PublicKey;
  nftMint: PublicKey;
  price: number;
  tokenAccount: PublicKey;
  escrowTokenAccount: PublicKey;
  createdAt: number;
  expiresAt: number | null;
  isActive: boolean;
  bump: number;
};

export type MarketplaceConfig = {
  authority: PublicKey;
  treasuryWallet: PublicKey;
  feePercentage: number;
  isPaused: boolean;
  bump: number;
};

export const IDL = {
  version: "0.1.0",
  name: "nft_marketplace",
  instructions: [
    {
      name: "buyNft",
      accounts: [
        { name: "buyer", isMut: true, isSigner: true },
        { name: "seller", isMut: true, isSigner: false },
        { name: "config", isMut: true, isSigner: false },
        { name: "listingAccount", isMut: true, isSigner: false },
        { name: "nftMint", isMut: true, isSigner: false },
        { name: "sellerTokenAccount", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "buyerTokenAccount", isMut: true, isSigner: false },
        { name: "treasuryWallet", isMut: true, isSigner: false },
        { name: "creatorWallet", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "listNft",
      accounts: [
        { name: "owner", isMut: true, isSigner: true },
        { name: "listingAccount", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "nftToken", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "marketplaceConfig", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: [
        { name: "price", type: "u64" },
        { name: "duration", type: "i64" }
      ]
    },
    {
      name: "delistNft",
      accounts: [
        { name: "owner", isMut: true, isSigner: true },
        { name: "listingAccount", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "ownerTokenAccount", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "listingAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "seller", type: "publicKey" },
          { name: "nftMint", type: "publicKey" },
          { name: "price", type: "u64" },
          { name: "tokenAccount", type: "publicKey" },
          { name: "escrowTokenAccount", type: "publicKey" },
          { name: "createdAt", type: "i64" },
          { name: "expiresAt", type: { option: "i64" } },
          { name: "isActive", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "marketplaceConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "treasuryWallet", type: "publicKey" },
          { name: "feePercentage", type: "u16" },
          { name: "isPaused", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: "MarketplacePaused",
      msg: "Marketplace đang tạm dừng"
    },
    {
      code: 6001,
      name: "InvalidPrice",
      msg: "Giá phải lớn hơn 0"
    },
    {
      code: 6002,
      name: "InvalidOwner",
      msg: "Bạn không sở hữu NFT này"
    },
    {
      code: 6003,
      name: "InvalidSeller",
      msg: "Bạn không phải người bán NFT này"
    },
    {
      code: 6005,
      name: "ListingNotActive",
      msg: "NFT listing không còn active"
    },
    {
      code: 6009,
      name: "InvalidEscrowAccount",
      msg: "Invalid escrow token account"
    }
  ]
} as const;

export type NftMarketplace = {
  version: "0.1.0";
  name: "nft_marketplace";
  instructions: typeof IDL.instructions;
  accounts: typeof IDL.accounts;
  errors: typeof IDL.errors;
};

export const PROGRAM_ID = new PublicKey("CFSd2NBvuNZY16M3jcYZufyZbhdok4esET8N2kyEdVrs");
export const MARKETPLACE_ADDRESS = new PublicKey("458FRZxoazBH6GVZFMDebd9oZi3NSVGwSAXf2iS3Mfw6");