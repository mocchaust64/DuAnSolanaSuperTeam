import axios from 'axios';

const PINATA_API_KEY = 'ef75d3484fb4418932fc';
const PINATA_SECRET_KEY = '9c8b6e4ebb849c3a5a011838e073001cc42bb1a802c53a4ff387358d039c1e06';

export async function uploadImageToIPFS(file: File, name: string) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pinataMetadata', JSON.stringify({
            name: name
        }));

        const res = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            }
        );

        return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

// Định nghĩa interface cho metadata
interface NFTMetadataUpload {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
}

export async function uploadNFTMetadata(metadata: NFTMetadataUpload) {
  const { name, symbol, description, image, attributes = [] } = metadata;
  
  const metadataObj = {
    name,
    symbol,
    description,
    image,
    attributes,
    properties: {
      files: [
        {
          uri: image,
          type: "image/png"
        }
      ],
      category: "image"
    }
  };

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadataObj,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw error;
  }
}