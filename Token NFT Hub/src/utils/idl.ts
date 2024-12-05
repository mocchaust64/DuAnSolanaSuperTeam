import { Idl } from '@project-serum/anchor';

export const IDL: Idl = {
  version: "0.1.0",
  name: "create_token",
  instructions: [
    {
      name: "createTokenMint",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "metadataAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "mintAccount",
          isMut: true,
          isSigner: true
        },
        {
          name: "tokenMetadataProgram",
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
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "tokenDecimals",
          type: "u8"
        },
        {
          name: "tokenName",
          type: "string"
        },
        {
          name: "tokenSymbol",
          type: "string"
        },
        {
          name: "tokenUri",
          type: "string"
        }
      ]
    },
    {
      name: "mintTo",
      accounts: [
        {
          name: "mint",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "burnToken",
      accounts: [
        {
          name: "mint",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "transferToken",
      accounts: [
        {
          name: "mint",
          isMut: false,
          isSigner: false
        },
        {
          name: "from",
          isMut: true,
          isSigner: false
        },
        {
          name: "to",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    }
  ]
};