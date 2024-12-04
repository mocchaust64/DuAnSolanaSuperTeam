export interface Creator {
    address: string;
    verified: boolean;
    share: number;
  }
  
  export interface Collection {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    creators?: Creator[];
    image?: string;
    description?: string;
    attributes?: { trait_type: string; value: string }[];
  }
  
  // Thêm interface cho NFT trong collection
  export interface CollectionNFT {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    image?: string;
    description?: string;
    collection?: {
      verified: boolean;
      address: string;
    };
    creators?: Creator[];
    attributes?: { trait_type: string; value: string }[];
  }