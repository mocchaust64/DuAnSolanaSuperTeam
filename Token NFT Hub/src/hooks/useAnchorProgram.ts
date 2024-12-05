// src/hooks/useAnchorProgram.ts
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { PROGRAM_ID } from '../utils/Constants';
import { useNetworkConfiguration } from '../contexts/NetworkConfigurationProvider';
import { IDL } from '../utils/idlNFT'; // Import IDL của marketplace

export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { networkConfiguration } = useNetworkConfiguration();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    
    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    
    return new Program(
      IDL,
      PROGRAM_ID, // Sử dụng MARKETPLACE_PROGRAM_ID
      provider
    );
  }, [provider]);

  return {
    program,
    provider,
    connection
  };
};