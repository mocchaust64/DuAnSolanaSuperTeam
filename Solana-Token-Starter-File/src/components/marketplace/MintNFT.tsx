import { FC, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../../hooks/useAnchorProgram';
import { uploadImageToIPFS, uploadNFTMetadata } from '../../utils/pinataUploader';
import { notify } from '../../utils/notifications';
import * as anchor from '@project-serum/anchor';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMint,
  getAccount,
} from '@solana/spl-token';
import { TOKEN_METADATA_PROGRAM_ID } from '../../utils/Constants';
import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  PublicKey,
  ComputeBudgetProgram,
  Transaction
} from '@solana/web3.js';
import { Metadata, PROGRAM_ID as METADATA_PROGRAM_ID, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { Connection } from '@solana/web3.js';
import * as bs58 from 'bs58';


const MINT_SIZE = 82;

// Thêm interface NFTFormData
interface NFTFormData {
  name: string;
  symbol: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
}

// Thêm interface NFTMetadata để match với pinataUploader
interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

// Đổi tên interface để tránh xung đột
interface NFTCollection {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
}

// Add interface for Collection
interface Collection {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  creators: Creator[];
}

// Thêm interfaces
interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

// Định nghĩa interface cho mintedNFT
interface MintedNFTType {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  collection?: {
    verified: boolean;
    address: string;
  };
}

// Props cho MintedNFTInfo component
interface MintedNFTInfoProps {
  mintedNFT: MintedNFTType | null;
}

// Component MintedNFTInfo với props
const MintedNFTInfo: FC<MintedNFTInfoProps> = ({ mintedNFT }) => {
  if (!mintedNFT) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6">
      <h3 className="text-xl font-semibold text-white mb-4">Minted NFT Details</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Status:</span>
          <span className="px-2 py-1 bg-green-600 text-white rounded-md">
            Minted Successfully
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Mint Address:</span>
          <a
            href={`https://explorer.solana.com/address/${mintedNFT.mint}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300"
          >
            {mintedNFT.mint.slice(0, 4)}...{mintedNFT.mint.slice(-4)} ↗
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Name:</span>
          <span className="text-white">{mintedNFT.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Symbol:</span>
          <span className="text-white">{mintedNFT.symbol}</span>
        </div>

        {mintedNFT.collection && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Collection:</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://explorer.solana.com/address/${mintedNFT.collection.address}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                {mintedNFT.collection.address.slice(0, 4)}...{mintedNFT.collection.address.slice(-4)} ↗
              </a>
              <span className={`px-2 py-1 rounded text-sm ${
                mintedNFT.collection.verified 
                  ? 'bg-green-600' 
                  : 'bg-yellow-600'
              }`}>
                {mintedNFT.collection.verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Metadata:</span>
          <a
            href={mintedNFT.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300"
          >
            View Metadata ↗
          </a>
        </div>
      </div>
    </div>
  );
};

// Helper function để lấy PDA cho metadata
const getMetadataPDA = (mint: PublicKey): PublicKey => {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return publicKey;
};

// Sửa lại helper function để khớp với program
const getMintAuthority = (programId: PublicKey): PublicKey => {
  const [mintAuthority] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("authority")  // Chỉ dùng "authority" làm seed
    ],
    programId
  );
  return mintAuthority;
};

// Props cho icons
const spinnerProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  children: (
    <>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </>
  )
};

const refreshIconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  children: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  )
};

export const MintNFT: FC = () => {
  const { program } = useAnchorProgram();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Di chuyển tất cả states vào đây
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [hasLoadedCollections, setHasLoadedCollections] = useState(() => {
    return localStorage.getItem('nft_collections_loaded') === 'true';
  });

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null as File | null,
    attributes: [] as { trait_type: string; value: string }[],
  });

  const [preview, setPreview] = useState<{
    mint?: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
  }>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    attributes: []
  });

  const [mintedNFT, setMintedNFT] = useState<MintedNFTType | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Thêm state để track trạng thái upload
  const [isImageUploaded, setIsImageUploaded] = useState(false);

  // Di chuyển fetchCollections vào đây
  const fetchCollections = useCallback(async () => {
    if (!publicKey || isLoadingCollections) return;

    try {
      setIsLoadingCollections(true);
      console.log("Bắt đầu tìm collections...");

      const metadataAccounts = await connection.getProgramAccounts(
        TOKEN_METADATA_PROGRAM_ID,
        {
          filters: [
            {
              memcmp: {
                offset: 326, // Offset cho creator address
                bytes: publicKey.toBase58()
              }
            }
          ]
        }
      );

      console.log(`Tìm thấy ${metadataAccounts.length} metadata accounts`);
      const collectionNFTs: Collection[] = [];

      for (const account of metadataAccounts) {
        try {
          const metadata = await Metadata.fromAccountAddress(connection, account.pubkey);
          
          // Log để debug
          console.log("Checking metadata:", {
            name: metadata.data.name.replace(/\0/g, ''),
            updateAuthority: metadata.updateAuthority.toBase58(),
            wallet: publicKey.toBase58(),
            isCollection: metadata.collectionDetails?.__kind === 'V1',
            creators: metadata.data.creators?.map(c => ({
              address: c.address.toBase58(),
              share: c.share
            }))
          });

          // Kiểm tra điều kiện collection
          if (metadata.collectionDetails?.__kind === 'V1') {
            collectionNFTs.push({
              mint: metadata.mint.toBase58(),
              name: metadata.data.name.replace(/\0/g, ''),
              symbol: metadata.data.symbol.replace(/\0/g, ''),
              uri: metadata.data.uri.replace(/\0/g, ''),
              creators: metadata.data.creators?.map(c => ({
                address: c.address.toBase58(),
                verified: c.verified,
                share: c.share
              })) || []
            });
            
            console.log("Added collection:", metadata.data.name.replace(/\0/g, ''));
          }
        } catch (err) {
          console.error("Error processing metadata:", err);
          continue;
        }
      }

      console.log("Found collections:", collectionNFTs);
      setCollections(collectionNFTs);
      
      localStorage.setItem('nft_collections_loaded', 'true');
      localStorage.setItem('nft_collections', JSON.stringify(collectionNFTs));

    } catch (error) {
      console.error('Error fetching collections:', error);
      notify({
        type: 'error',
        message: 'Error loading collections',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoadingCollections(false);
    }
  }, [connection, publicKey, isLoadingCollections]);

  // Di chuyển useEffect vào đây
  useEffect(() => {
    const savedCollections = localStorage.getItem('nft_collections');
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  // Sửa lại hàm handleImageUpload
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const imageUrl = await uploadImageToIPFS(file, file.name);
      console.log("Image uploaded successfully:", imageUrl);
      setIsImageUploaded(true); // Set trạng thái upload thành công
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsImageUploaded(false); // Reset trạng thái nếu upload thất bại
      notify({ 
        type: 'error',
        message: 'Error uploading image',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleMint = async () => {
    try {
      setUploading(true);
      setErrors({});

      // Validation
      if (!formData.name) {
        setErrors(prev => ({...prev, name: 'Name is required'}));
        return;
      }

      if (!formData.image) {
        setErrors(prev => ({...prev, image: 'Image is required'}));
        return;
      }

      // Upload image first
      const imageUrl = await handleImageUpload(formData.image);

      // Then upload metadata
      const metadataUrl = await uploadNFTMetadata({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: imageUrl,
        attributes: formData.attributes
      });

      console.log("Metadata uploaded:", metadataUrl);

      // 3. Mint NFT
      const mintKeypair = anchor.web3.Keypair.generate();
      console.log("NFT Mint pubkey:", mintKeypair.publicKey.toString());

      // Lấy mint authority PDA
      const mintAuthorityPDA = getMintAuthority(program.programId);
      console.log("Mint Authority PDA:", mintAuthorityPDA.toString());

      // Tạo các PDAs và accounts
      const metadataPDA = await getMetadata(mintKeypair.publicKey);
      const masterEditionPDA = await getMasterEdition(mintKeypair.publicKey);
      const destinationAta = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        publicKey
      );

      // Collection PDAs
      const collectionMint = new PublicKey(selectedCollection);
      const collectionMetadataPDA = await getMetadata(collectionMint);
      const collectionMasterEditionPDA = await getMasterEdition(collectionMint);

      // Thêm compute budget
      const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000
      });

      // Tạo các instructions khởi tạo mint account
      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID
      });

      const initializeMintIx = createInitializeMintInstruction(
        mintKeypair.publicKey,
        0,
        publicKey, // Owner là mint authority
        publicKey  // Owner là freeze authority
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        publicKey,
        destinationAta,
        publicKey,
        mintKeypair.publicKey
      );

      // Mint NFT instruction
      const mintNftIx = await program.methods
        .mintNft({
          name: formData.name,
          symbol: formData.symbol,
          uri: metadataUrl,
          sellerFeeBasisPoints: 500,
          creators: [{
            address: publicKey,
            verified: true,
            share: 100
          }]
        })
        .accounts({
          owner: publicKey,
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey, // Owner là mint authority
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          destination: destinationAta,
          collectionMint,
          collectionMetadata: collectionMetadataPDA,
          collectionMasterEdition: collectionMasterEditionPDA,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      // Combine all instructions
      const transaction = new Transaction()
        .add(modifyComputeUnits)
        .add(createMintAccountIx)
        .add(initializeMintIx)
        .add(createAtaIx)
        .add(mintNftIx);

      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Sign with mint keypair
      transaction.sign(mintKeypair);
      
      // Sign with wallet
      const signedTx = await signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txId, 'confirmed');

      // Thêm verification ở đây
      const verifyMintAccount = async (mintPubkey: PublicKey) => {
        try {
          const mintInfo = await getMint(connection, mintPubkey);
          
          // Kiểm tra các điều kiện cần thiết
          if (mintInfo.decimals !== 0) throw new Error("Invalid decimals");
          if (mintInfo.supply !== BigInt(1)) throw new Error("Invalid supply");
          if (!mintInfo.isInitialized) throw new Error("Mint not initialized");
          
          return true;
        } catch (error) {
          console.error("Mint verification failed:", error);
          return false;
        }
      };

      // Verify mint account
      const isMintValid = await verifyMintAccount(mintKeypair.publicKey);
      if (!isMintValid) {
        throw new Error("NFT mint không hợp lệ cho listing");
      }

      // Sau khi verify thành công, tiếp tục với phần còn lại
      const mintedMetadata = await Metadata.fromAccountAddress(
        connection,
        await getMetadata(mintKeypair.publicKey)
      );

      // Cập nhật state mintedNFT
      setMintedNFT({
        mint: mintKeypair.publicKey.toString(),
        name: mintedMetadata.data.name.replace(/\0/g, ''),
        symbol: mintedMetadata.data.symbol.replace(/\0/g, ''),
        uri: mintedMetadata.data.uri.replace(/\0/g, ''),
        collection: mintedMetadata.collection ? {
          verified: mintedMetadata.collection.verified,
          address: mintedMetadata.collection.key.toString()
        } : undefined
      });

      notify({ 
        type: 'success', 
        message: 'NFT minted successfully!',
        txid: txId
      });

      // Sau khi mint thành công, verify collection
      if (selectedCollection) {
        try {
          console.log("Verifying collection...");
          
          // Lấy PDAs cho collection
          const collectionMint = new PublicKey(selectedCollection);
          const collectionMetadataPDA = await getMetadata(collectionMint);
          const collectionMasterEditionPDA = await getMasterEdition(collectionMint);
          
          // Lấy PDAs cho NFT
          const nftMetadataPDA = await getMetadata(mintKeypair.publicKey);

          // Lấy mint authority PDA
          const [mintAuthorityPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("authority")],
            program.programId
          );

          // Tạo verify collection instruction với accounts đúng theo Rust struct
          const verifyIx = await program.methods
            .verifyCollection()
            .accounts({
              authority: publicKey,
              metadata: nftMetadataPDA,
              mint: mintKeypair.publicKey,
              mintAuthority: mintAuthorityPDA,
              collectionMint: collectionMint,
              collectionMetadata: collectionMetadataPDA,
              collectionMasterEdition: collectionMasterEditionPDA,
              systemProgram: SystemProgram.programId,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              sysvarInstruction: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            })
            .instruction();
          console.log("Verify instruction created with accounts:", {
            authority: publicKey.toString(),
            metadata: nftMetadataPDA.toString(),
            mint: mintKeypair.publicKey.toString(),
            mintAuthority: mintAuthorityPDA.toString(),
            collectionMint: collectionMint.toString(),
            collectionMetadata: collectionMetadataPDA.toString(),
            collectionMasterEdition: collectionMasterEditionPDA.toString()
          });

          // Tạo và gửi transaction verify
          const verifyTx = new Transaction().add(verifyIx);
          verifyTx.feePayer = publicKey;
          verifyTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

          const signedVerifyTx = await signTransaction(verifyTx);
          const verifyTxId = await connection.sendRawTransaction(signedVerifyTx.serialize());
          await connection.confirmTransaction(verifyTxId, 'confirmed');

          console.log("Collection verified successfully!");
          
          // Cập nhật state mintedNFT với trạng thái verified mới
          setMintedNFT(prev => prev ? {
            ...prev,
            collection: {
              ...prev.collection!,
              verified: true
            }
          } : null);

          notify({ 
            type: 'success', 
            message: 'Collection verified successfully!',
            txid: verifyTxId
          });

        } catch (verifyError) {
          console.error("Error verifying collection:", verifyError);
          notify({ 
            type: 'error', 
            message: 'Error verifying collection', 
            description: verifyError instanceof Error ? verifyError.message : 'Unknown error'
          });
        }
      }

      // Kiểm tra trạng thái sau khi mint
      const mintStatus = await checkMintStatus(mintKeypair.publicKey, publicKey);
      console.log("Mint status:", mintStatus);

      if (!mintStatus.isInitialized || !mintStatus.hasCorrectBalance || !mintStatus.hasMetadata) {
        throw new Error("NFT mint không thành công hoặc không đầy đủ");
      }

      // 1. Kiểm tra quyền sở hữu token account
      const verifyTokenAccount = async (
        mintPubkey: PublicKey,
        ownerPubkey: PublicKey
      ) => {
        try {
          const tokenAccount = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
          const tokenAccountInfo = await getAccount(connection, tokenAccount);
          
          console.log("\n=== Token Account Verification ===");
          console.log("Token Account:", tokenAccount.toBase58());
          console.log("Owner:", tokenAccountInfo.owner.toBase58());
          console.log("Mint:", tokenAccountInfo.mint.toBase58());
          console.log("Amount:", tokenAccountInfo.amount.toString());
          
          // Kiểm tra các điều kiện
          if (tokenAccountInfo.owner.toBase58() !== ownerPubkey.toBase58()) {
            throw new Error("Token account owner mismatch");
          }
          if (tokenAccountInfo.mint.toBase58() !== mintPubkey.toBase58()) {
            throw new Error("Token account mint mismatch");
          }
          if (tokenAccountInfo.amount !== BigInt(1)) {
            throw new Error("Token account amount should be 1");
          }
          
          return true;
        } catch (error) {
          console.error("Token account verification failed:", error);
          return false;
        }
      };

      // 2. Kiểm tra Metadata PDA
      const verifyMetadataPDA = async (mintPubkey: PublicKey) => {
        try {
          const metadataPDA = await getMetadata(mintPubkey);
          const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
          
          console.log("\n=== Metadata PDA Verification ===");
          console.log("Metadata Address:", metadataPDA.toBase58());
          console.log("Update Authority:", metadata.updateAuthority.toBase58());
          console.log("Mint:", metadata.mint.toBase58());
          console.log("Name:", metadata.data.name);
          console.log("Symbol:", metadata.data.symbol);
          console.log("URI:", metadata.data.uri);
          console.log("Creators:", metadata.data.creators?.map(c => ({
            address: c.address.toBase58(),
            verified: c.verified,
            share: c.share
          })));
          
          // Kiểm tra các điều kiện
          if (metadata.mint.toBase58() !== mintPubkey.toBase58()) {
            throw new Error("Metadata mint mismatch");
          }
          if (!metadata.data.name) {
            throw new Error("Missing name in metadata");
          }
          if (!metadata.data.symbol) {
            throw new Error("Missing symbol in metadata");
          }
          if (!metadata.data.uri) {
            throw new Error("Missing uri in metadata");
          }
          
          return true;
        } catch (error) {
          console.error("Metadata PDA verification failed:", error);
          return false;
        }
      };

      // 3. Kiểm tra Collection
      const verifyCollection = async (
        mintPubkey: PublicKey,
        collectionMint: PublicKey
      ) => {
        try {
          const metadataPDA = await getMetadata(mintPubkey);
          const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
          
          console.log("\n=== Collection Verification ===");
          console.log("Collection Key:", metadata.collection?.key.toBase58());
          console.log("Collection Verified:", metadata.collection?.verified);
          
          // Kiểm tra các điều kiện
          if (!metadata.collection) {
            throw new Error("NFT không thuộc collection nào");
          }
          if (metadata.collection.key.toBase58() !== collectionMint.toBase58()) {
            throw new Error("Collection mint mismatch");
          }
          if (!metadata.collection.verified) {
            throw new Error("Collection chưa được verify");
          }
          
          return true;
        } catch (error) {
          console.error("Collection verification failed:", error);
          return false;
        }
      };

      // Thêm vào trong hàm handleMint sau khi mint thành công
      const verifyAllAccounts = async () => {
        console.log("\n=== Starting Full Verification ===");
        
        // 1. Verify mint account
        const isMintValid = await verifyMintAccount(mintKeypair.publicKey);
        if (!isMintValid) {
          throw new Error("NFT mint không hợp lệ");
        }
        
        // 2. Verify token account
        const isTokenAccountValid = await verifyTokenAccount(
          mintKeypair.publicKey,
          publicKey
        );
        if (!isTokenAccountValid) {
          throw new Error("Token account không hợp lệ");
        }
        
        // 3. Verify metadata
        const isMetadataValid = await verifyMetadataPDA(mintKeypair.publicKey);
        if (!isMetadataValid) {
          throw new Error("Metadata không hợp lệ");
        }
        
        // 4. Verify collection nếu có
        if (selectedCollection) {
          const isCollectionValid = await verifyCollection(
            mintKeypair.publicKey,
            new PublicKey(selectedCollection)
          );
          if (!isCollectionValid) {
            throw new Error("Collection verification thất bại");
          }
        }
        
        console.log("\n=== All Verifications Passed ===");
        return true;
      };

      // Verify tất cả accounts
      await verifyAllAccounts();

    } catch (error: any) {
      console.error('Error minting NFT:', error);
      notify({ 
        type: 'error', 
        message: 'Error minting NFT', 
        description: error.message 
      });
    } finally {
      setUploading(false);
    }
  };

  const checkMintStatus = async (mintPubkey: PublicKey, ownerPubkey: PublicKey) => {
    try {
      // Kiểm tra mint account
      const mintInfo = await getMint(connection, mintPubkey);
      console.log("=== Mint Account Info ===");
      console.log("Mint pubkey:", mintPubkey.toBase58());
      console.log("Mint authority:", mintInfo.mintAuthority?.toBase58());
      console.log("Supply:", mintInfo.supply);
      console.log("Decimals:", mintInfo.decimals);
      
      // Kiểm tra token account
      const tokenAccount = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
      const tokenAccountInfo = await getAccount(connection, tokenAccount);
      console.log("\n=== Token Account Info ===");
      console.log("Token account:", tokenAccount.toBase58());
      console.log("Owner:", tokenAccountInfo.owner.toBase58());
      console.log("Amount:", tokenAccountInfo.amount);
      
      // Kiểm tra metadata
      const metadataPDA = await getMetadata(mintPubkey);
      const metadata = await Metadata.fromAccountAddress(connection, metadataPDA);
      console.log("\n=== Metadata Info ===");
      console.log("Name:", metadata.data.name);
      console.log("Symbol:", metadata.data.symbol);
      console.log("URI:", metadata.data.uri);
      
      return {
        isInitialized: mintInfo.supply > BigInt(0),
        hasCorrectBalance: tokenAccountInfo.amount === BigInt(1),
        hasMetadata: true
      };
    } catch (error) {
      console.error("Error checking mint status:", error);
      return {
        isInitialized: false,
        hasCorrectBalance: false,
        hasMetadata: false
      };
    }
  };

  // Chỉ thay đổi phần return
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Mint NFT</h2>
        <p className="text-gray-400 mt-2">Create your unique NFT and add it to your collection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Section - Left Column */}
        <div className="bg-gray-800 rounded-xl p-8 space-y-8">
          {/* Collection Selection */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              Collection Details
            </label>
            <div className="flex gap-3">
              <select
                className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 transition-colors"
                value={selectedCollection || ''}
                onChange={(e) => setSelectedCollection(e.target.value)}
                disabled={isLoadingCollections}
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.mint} value={collection.mint}>
                    {collection.name} ({collection.symbol})
                  </option>
                ))}
              </select>
              <button 
                onClick={fetchCollections}
                disabled={isLoadingCollections}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isLoadingCollections 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                }`}
              >
                {isLoadingCollections ? (
                  <svg className="animate-spin h-5 w-5" {...spinnerProps} />
                ) : (
                  <svg className="h-5 w-5" {...refreshIconProps} />
                )}
              </button>
            </div>
          </div>

          {/* NFT Details */}
          <div className="space-y-6">
            <label className="block text-lg font-semibold text-white">
              NFT Details
            </label>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 transition-colors"
                  placeholder="NFT Name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 transition-colors"
                placeholder="Symbol"
              />

              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 transition-colors"
                rows={4}
                placeholder="Description"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              NFT Image
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setFormData({...formData, image: file});
                      setPreview({
                        ...preview,
                        image: URL.createObjectURL(file)
                      });
                      await handleImageUpload(file);
                    } catch (error) {
                      setFormData({...formData, image: null});
                      setPreview({...preview, image: ''});
                    }
                  }
                }}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
            </div>
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={uploading || !selectedCollection || !formData.name || !isImageUploaded}
            className={`w-full px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
              uploading || !selectedCollection || !formData.name || !isImageUploaded
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" {...spinnerProps} />
                <span>Minting...</span>
              </div>
            ) : (
              'Mint NFT'
            )}
          </button>
        </div>

        {/* Preview Section - Right Column */}
        <div className="space-y-8">
          {/* Preview Card */}
          <div className="bg-gray-800 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-6">Preview</h3>
            
            <div className="space-y-6">
              {preview.image && (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900">
                  <img
                    src={preview.image}
                    alt="NFT Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Name</span>
                  <span className="text-white font-medium">
                    {preview.name || formData.name || 'Not set'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Symbol</span>
                  <span className="text-white font-medium">
                    {preview.symbol || formData.symbol || 'Not set'}
                  </span>
                </div>
                
                <div className="py-2 border-b border-gray-700">
                  <span className="text-gray-400 block mb-2">Description</span>
                  <p className="text-white">
                    {preview.description || formData.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Minted NFT Info */}
          <MintedNFTInfo mintedNFT={mintedNFT} />
        </div>
      </div>
    </div>
  );
};

// Thêm hàm helper để lấy PDA cho metadata và master edition
const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return publicKey;
};

const getMasterEdition = async (mint: PublicKey): Promise<PublicKey> => {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return publicKey;
};