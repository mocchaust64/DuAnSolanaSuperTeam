// src/hooks/useListedNFTs.ts
import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { AccountInfo, PublicKey, Connection } from '@solana/web3.js';
import axios from 'axios';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

import { IDL } from '../idl/nft_marketplace';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

export interface ListedNFT {
  mint: PublicKey;
  price: number;
  seller: PublicKey;
  tokenAccount: PublicKey;
  metadata: {
    name: string;
    symbol: string;
    uri: string;
    image: string;
    description: string;
  };
}

const PROGRAM_ID = new PublicKey('CFSd2NBvuNZY16M3jcYZufyZbhdok4esET8N2kyEdVrs');

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const transformIPFSUrl = (url: string): string => {
  if (!url) return '';
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', PINATA_GATEWAY);
  }

  // Handle direct IPFS hash
  if (url.startsWith('Qm')) {
    return `${PINATA_GATEWAY}${url}`;
  }

  // Handle full IPFS URLs
  if (url.includes('/ipfs/')) {
    const splitUrl = url.split('/ipfs/');
    return `${PINATA_GATEWAY}${splitUrl[splitUrl.length - 1]}`;
  }

  return url;
};

export const useListedNFTs = (sellerFilter?: PublicKey | null) => {
  const [listings, setListings] = useState<ListedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const { connection } = useConnection();

  useEffect(() => {
    let mounted = true;

    const fetchListings = async () => {
      if (!connection) return;

      try {
        setLoading(true);
        console.log("Fetching listings for seller:", sellerFilter?.toString());
        
        const accounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log("Found accounts:", accounts.length);

        const decodedListings = accounts
          .map(({ pubkey, account }) => {
            try {
              const decoded = decodeListingAccount(account);
              if (!decoded) return null;
              
              console.log("Decoded listing:", {
                pubkey: pubkey.toString(),
                seller: decoded.seller.toString(),
                isActive: decoded.isActive
              });
              
              return { pubkey, account: decoded };
            } catch (err) {
              return null;
            }
          })
          .filter((listing): listing is NonNullable<typeof listing> => {
            if (!listing) return false;
            if (sellerFilter) {
              const isOwner = listing.account.seller.equals(sellerFilter);
              console.log("Checking ownership:", {
                listingSeller: listing.account.seller.toString(),
                filterSeller: sellerFilter.toString(),
                isOwner,
                isActive: listing.account.isActive
              });
              return isOwner && listing.account.isActive;
            }
            return listing.account.isActive;
          });

        console.log("Filtered listings:", decodedListings.length);

        const processedListings = await Promise.all(
          decodedListings.map(async (listing) => {
            try {
              const [metadataPDA] = PublicKey.findProgramAddressSync(
                [
                  Buffer.from('metadata'),
                  TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                  listing.account.nftMint.toBuffer()
                ],
                TOKEN_METADATA_PROGRAM_ID
              );

              const metadata = await fetchMetadata(connection, metadataPDA);
              if (!metadata) return null;

              return {
                mint: listing.account.nftMint,
                price: listing.account.price,
                seller: listing.account.seller,
                tokenAccount: listing.account.tokenAccount,
                metadata
              };
            } catch (err) {
              console.error('Error processing metadata:', err);
              return null;
            }
          })
        );

        if (mounted) {
          const validListings = processedListings.filter(Boolean);
          console.log("Final processed listings:", validListings.length);
          setListings(validListings);
        }
      } catch (err) {
        console.error("Error fetching listings:", err);
        if (mounted) setListings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchListings();
    return () => { mounted = false; };
  }, [connection, sellerFilter]);

  return { listings, loading };
};

const decodeListingAccount = (account: AccountInfo<Buffer>) => {
  try {
    const buffer = account.data;
    
    // Update minimum size calculation
    const minSize = 8 + // discriminator
      (32 * 4) + // seller, nftMint, tokenAccount, escrowTokenAccount
      8 + // price
      8 + // createdAt
      1 + // expiresAt option flag
      1 + // isActive
      1; // bump

    if (buffer.length < minSize) {
      console.log(`Buffer length: ${buffer.length}, Required: ${minSize}`);
      return null;
    }

    let offset = 8; // Skip discriminator

    // Read seller
    const seller = new PublicKey(buffer.slice(offset, offset + 32));
    offset += 32;

    // Read nftMint
    const nftMint = new PublicKey(buffer.slice(offset, offset + 32));
    offset += 32;

    // Read price (as BE u64)
    const price = buffer.readBigUInt64LE(offset);
    offset += 8;

    // Read tokenAccount
    const tokenAccount = new PublicKey(buffer.slice(offset, offset + 32));
    offset += 32;

    // Read escrowTokenAccount
    const escrowTokenAccount = new PublicKey(buffer.slice(offset, offset + 32));
    offset += 32;

    // Read createdAt
    const createdAt = buffer.readBigInt64LE(offset);
    offset += 8;

    // Read expiresAt option
    const hasExpiresAt = buffer[offset] === 1;
    offset += 1;
    const expiresAt = hasExpiresAt ? Number(buffer.readBigInt64LE(offset)) : null;
    if (hasExpiresAt) offset += 8;

    // Read isActive
    const isActive = buffer[offset] === 1;
    offset += 1;

    // Read bump
    const bump = buffer[offset];

    return {
      seller,
      nftMint,
      price: Number(price) / 1e9, // Convert to SOL
      tokenAccount,
      escrowTokenAccount,
      createdAt: Number(createdAt),
      expiresAt,
      isActive,
      bump
    };
  } catch (err) {
    console.error('Error decoding account:', err);
    return null;
  }
};

const fetchWithRetry = async (url: string, options = {
  retries: 3,
  delay: 1000
}) => {
  let lastError;
  for (let i = 0; i < options.retries; i++) {
    try {
      return await axios.get(url, { timeout: 5000 });
    } catch (err) {
      lastError = err;
      if (i === options.retries - 1) break;
      await new Promise(resolve => setTimeout(resolve, options.delay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

const cleanString = (str: string): string => {
  return str.replace(/\x00/g, '').trim();
};

const fetchMetadata = async (connection: Connection, metadataPDA: PublicKey) => {
  try {
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    if (!metadataAccount) return null;

    const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
    
    const cleanMetadata = {
      name: cleanString(metadata.data.name),
      symbol: cleanString(metadata.data.symbol),
      uri: cleanString(metadata.data.uri)
    };

    // Fetch NFT metadata from URI
    const { data: nftMetadata } = await axios.get(cleanMetadata.uri);

    return {
      name: cleanMetadata.name,
      symbol: cleanMetadata.symbol,
      uri: cleanMetadata.uri,
      image: nftMetadata.image,
      description: nftMetadata.description
    };
  } catch (err) {
    console.error('Error fetching metadata:', err);
    return null;
  }
};