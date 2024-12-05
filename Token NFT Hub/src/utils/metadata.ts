import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_METADATA_PROGRAM_ID } from './Constants';

export class Metadata {
  static async getPDA(mint: PublicKey): Promise<PublicKey> {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return publicKey;
  }

  static async load(connection: Connection, pda: PublicKey) {
    const metadata = await connection.getAccountInfo(pda);
    if (!metadata) throw new Error('Metadata not found');
    return this.decode(metadata.data);
  }

  static decode(data: Buffer) {
    return {
      data: {
        data: {
          name: data.toString('utf8', 1, 33).replace(/\0/g, ''),
          symbol: data.toString('utf8', 33, 65).replace(/\0/g, ''),
          uri: data.toString('utf8', 65, 200).replace(/\0/g, ''),
          creators: [{
            address: new PublicKey(data.slice(326, 358)),
            verified: data[358] === 1,
            share: data[359]
          }]
        }
      }
    };
  }
}