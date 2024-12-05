import { Program, AnchorProvider, Idl } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { IDL } from './idl';

export const getProgram = (connection: Connection, wallet: any) => {
  const provider = new AnchorProvider(
    connection, 
    wallet,
    AnchorProvider.defaultOptions()
  );

  return new Program(
    IDL as Idl,
    new PublicKey("5VebaeFAsUx3xWjngDkvoJKCDVUxdxVt8b7QSNnzDeTT"),
    provider
  );
};