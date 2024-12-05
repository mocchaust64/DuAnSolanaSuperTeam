import { PublicKey } from "@solana/web3.js";

export interface NFTAttribute {
    trait_type: string;
    value: string;
  }
  
  export interface NFTMetadata {
    name: string;
    symbol?: string;
    description?: string;
    image?: string;
    attributes?: NFTAttribute[];
    price?: number;
  }
  
  export interface NFTCreator {
    address: string;
    verified: boolean;
    share: number;
  }
  
  export interface NFTCollection {
    verified: boolean;
    address: string;
  }
  
  export interface NFT {
    mint: string;
    name?: string;
    symbol?: string;
    uri?: string;
    image?: string;
    description?: string;
    creators?: NFTCreator[];
    collection?: NFTCollection;
    attributes?: NFTAttribute[];
    price?: number;
    seller?: string;
    treasuryWallet?: string;
    metadata?: NFTMetadata;
    isListed?: boolean;
    listingType?: 'fixed' | 'auction';
    endTime?: number;
  }
  
  export interface ListedNFT extends NFT {
    price: number;
    seller: string;
    treasuryWallet: string;
    isListed: true;
  }
  
  export interface NFTListing {
    mint: string | PublicKey;
    price: number;
    seller: string | PublicKey;
    metadata: NFTMetadata;
    endTime?: number;
  }