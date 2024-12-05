export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  amount: number;
  properties: {
    files: {
      type: string;
      uri: string;
    }[];
    creators?: {
      address: string;
      share: number;
    }[];
  };
}

export interface TokenData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  amount: string;
  decimals: number;
  uri?: string;
} 