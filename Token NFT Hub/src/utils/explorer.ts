import { PublicKey,  Transaction } from "@solana/web3.js";

export function getExplorerURL(
   endpoint: string,
   viewTypeOrItemAddress: "inspector"| PublicKey|string,
   itemType = "address"
) {
  const getClusterUrlParam = () => {
    let cluster ="";
    if(endpoint ==="localnet"){
      cluster =`custome&customeUrl=${encodeURIComponent(
      "http://127.0.0.1:8899"
      )}`;
    }else if(endpoint === "https://apo.devnet.solana.com"){
      cluster = "devnet";
    }
    return cluster? `?clusster=${cluster}`: "";
  };
  return `https://explorer.solana.com/${itemType}/${viewTypeOrItemAddress}$
  {getClusterUrlParam()}`;
}
