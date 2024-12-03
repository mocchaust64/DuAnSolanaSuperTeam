// src/utils/idl.ts
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
  seller_fee_basis_points: number;
  creators: Creator[];
};

export type ListingAccount = {
  seller: PublicKey;
  nft_mint: PublicKey;
  price: number;
  token_account: PublicKey;
  created_at: number;
  expires_at: number | null;
  bump: number;
  escrow_token_account: PublicKey;
  is_active: boolean;
};

export type MarketplaceConfig = {
  authority: PublicKey;
  treasury_wallet: PublicKey;
  fee_percentage: number;
  is_paused: boolean;
  bump: number;
};

export const IDL: Idl = {
  version: "0.1.0",
  name: "nft_marketplace",
  instructions: [
    {
      name: "closeMarketplace",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true
        },
        {
          name: "config",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "createCollection",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "mint",
          isMut: true,
          isSigner: true
        },
        {
          name: "mintAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "masterEdition",
          isMut: true,
          isSigner: false
        },
        {
          name: "destination",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "collectionMetadata",
          type: {
            defined: "NFTMetadata"
          }
        }
      ]
    },
    {
      name: "initializeMarketplace",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true
        },
        {
          name: "config",
          isMut: true,
          isSigner: false
        },
        {
          name: "treasuryWallet",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "feePercentage",
          type: "u16"
        }
      ]
    },
    {
      name: "listNft",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "listingAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "nftToken",
          isMut: true,
          isSigner: false
        },
        {
          name: "escrowTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "marketplaceConfig",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "price",
          type: "u64"
        },
        {
          name: "duration",
          type: "i64"
        }
      ]
    },
    {
      name: "mintNft",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false
        },
        {
          name: "mintAuthority",
          isMut: true,
          isSigner: true
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "masterEdition",
          isMut: true,
          isSigner: false
        },
        {
          name: "destination",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionMetadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionMasterEdition",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "nftMetadata",
          type: {
            defined: "NFTMetadata"
          }
        }
      ]
    },
    {
      name: "pauseMarketplace",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        }
      ],
      args: []
    },
    {
      name: "unpauseMarketplace",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        }
      ],
      args: []
    },
    {
      name: "updateListing",
      accounts: [
        {
          name: "listingAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "seller",
          isMut: true,
          isSigner: true
        }
      ],
      args: [
        {
          name: "price",
          type: "u64"
        },
        {
          name: "duration",
          type: "i64"
        }
      ]
    },
    {
      name: "updateMetadata",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "metadata",
          type: {
            defined: "NFTMetadata"
          }
        }
      ]
    },
    {
      name: "verifyCollection",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false
        },
        {
          name: "mintAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "collectionMetadata",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionMasterEdition",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "sysvarInstruction",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "buyNft",
      accounts: [
        {
          name: "buyer",
          isMut: true,
          isSigner: true
        },
        {
          name: "seller",
          isMut: true,
          isSigner: false
        },
        {
          name: "config",
          isMut: true,
          isSigner: false
        },
        {
          name: "listingAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "sellerTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "escrowTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "buyerTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "treasuryWallet",
          isMut: true,
          isSigner: false
        },
        {
          name: "creatorWallet",
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "ListingAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "seller",
            type: "publicKey"
          },
          {
            name: "nftMint", 
            type: "publicKey"
          },
          {
            name: "price",
            type: "u64"
          },
          {
            name: "tokenAccount",
            type: "publicKey"
          },
          {
            name: "createdAt",
            type: "i64"
          },
          {
            name: "expiresAt",
            type: {
              option: "i64"
            }
          },
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "escrow_token_account",
            type: "publicKey"
          },
          {
            name: "is_active",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "MarketplaceConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey"
          },
          {
            name: "treasuryWallet",
            type: "publicKey"
          },
          {
            name: "feePercentage",
            type: "u16"
          },
          {
            name: "isPaused",
            type: "bool"
          },
          {
            name: "bump",
            type: "u8"
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidMetadata",
      msg: "Invalid metadata"
    },
    {
      code: 6001,
      name: "InvalidCollectionMetadata",
      msg: "Invalid collection metadata"
    },
    {
      code: 6002,
      name: "MetadataUpdateNotAllowed",
      msg: "Metadata update not allowed"
    },
    {
      code: 6003,
      name: "InvalidCreatorShare",
      msg: "Invalid creator share"
    },
    {
      code: 6004,
      name: "InvalidAuthority",
      msg: "Invalid authority"
    },
    {
      code: 6005,
      name: "InvalidMintAuthority",
      msg: "Invalid mint authority"
    },
    {
      code: 6006,
      name: "AlreadyMinted",
      msg: "Already minted"
    },
    {
      code: 6007,
      name: "InvalidNFTSupply",
      msg: "Invalid NFT supply - must be 1"
    },
    {
      code: 6008,
      name: "InvalidTokenAmount",
      msg: "Invalid token amount - must be 1"
    },
    {
      code: 6009,
      name: "InvalidMarketplaceAuthority",
      msg: "Invalid marketplace authority"
    }
  ],
  types: [
    {
      name: "NFTMetadata",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string"
          },
          {
            name: "symbol",
            type: "string"
          },
          {
            name: "uri",
            type: "string"
          },
          {
            name: "sellerFeeBasisPoints",
            type: "u16"
          },
          {
            name: "creators",
            type: {
              vec: {
                defined: "Creator"
              }
            }
          }
        ]
      }
    },
    {
      name: "Creator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "publicKey"
          },
          {
            name: "verified",
            type: "bool"
          },
          {
            name: "share",
            type: "u8"
          }
        ]
      }
    }
  ]
};

export type NftMarketplace = {
  version: "0.1.0";
  name: "nft_marketplace";
  instructions: typeof IDL.instructions;
  accounts: typeof IDL.accounts;
  errors: typeof IDL.errors;
};