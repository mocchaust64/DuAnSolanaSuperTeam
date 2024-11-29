// src/views/marketplace/CreateNFTSection.tsx
import { FC } from 'react';
import dynamic from 'next/dynamic';
import { MdCollections } from 'react-icons/md';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const CreateNFTSection: FC<{ setOpenMintModal: (open: boolean) => void }> = ({ setOpenMintModal }) => {
  return (
    <section className="relative overflow-hidden pb-20 pt-[1px]">
      <div className="px-6 py-4">
        <div className="bg-default-950/40 rounded-2xl">
          <div className="container">
            <div className="p-6">
              <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                <div className="bg-primary/10 -z-1 start-0 absolute top-0 h-14 w-14 animate-[spin_10s_linear_infinite] rounded-2xl rounded-br-none rounded-tl-none"></div>
                <div className="bg-primary/20 -z-1 end-0 absolute bottom-0 h-14 w-14 animate-ping rounded-full"></div>

                <div>
                  <span className="text-primary bg-primary/20 rounded-md px-3 py-1 text-sm font-medium uppercase tracking-wider">
                    CREATE SOLANA NFT
                  </span>

                  <h1 className="md:text-5xl/tight my-4 max-w-lg text-4xl font-bold text-white">
                    Mint NFT của bạn trên Solana Blockchain
                  </h1>
                  
                  <p className="text-default-300 md:text-lg mb-8">
                    Tạo và mint NFT một cách dễ dàng với công cụ No-Code. 
                    Tải lên hình ảnh, thêm metadata và mint NFT của bạn ngay lập tức trên Solana.
                  </p>

                  <ul className="text-default-300 space-y-4 mb-8">
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary rounded-full p-1 mr-3">✓</span>
                      Mint NFT chỉ với vài bước đơn giản
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary rounded-full p-1 mr-3">✓</span>
                      Tự động tạo metadata chuẩn Metaplex
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary/20 text-primary rounded-full p-1 mr-3">✓</span>
                      Phí gas thấp, tốc độ xử lý nhanh
                    </li>
                  </ul>

                  <div className="mt-10 flex items-center space-x-4">
                    <a onClick={() => setOpenMintModal(true)} 
                       className="hover:bg-primary-hover group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-1 py-1 text-white transition-all duration-300">
                      <span className="bg-primary/20 text-primary me-2 flex h-11 w-11 items-center justify-center rounded-full group-hover:bg-white/10">
                        <MdCollections />
                      </span>
                      Mint NFT Now
                    </a>

                    <div suppressHydrationWarning>
                      <WalletMultiButtonDynamic 
                        className="btn !bg-gradient-to-br from-indigo-500 to-fuchsia-500 !text-white font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </div>
                  </div>
                </div>

                <div className="mx-auto h-[595px] overflow-hidden">
                  <div className="marquee grid grid-cols-2 gap-6">
                    {/* Cột 1 - Chạy từ dưới lên */}
                    <div className="receive m-auto flex flex-col gap-6 overflow-hidden">
                      <div className="animate-marquee-upward flex flex-col items-center gap-6">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <img 
                            key={`nft-${num}`}
                            src={`/assets/images/nfts/nft${num}.png`}
                            alt=""
                            className="h-[220px] w-[220px] rounded-xl object-cover"
                          />
                        ))}
                        {/* Duplicate để tạo liên tục */}
                        {[1, 2, 3, 4, 5].map((num) => (
                          <img 
                            key={`nft-dup-${num}`}
                            src={`/assets/images/nfts/nft${num}.png`}
                            alt=""
                            className="h-[220px] w-[220px] rounded-xl object-cover"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Cột 2 - Chạy từ trên xuống */}
                    <div className="send m-auto flex flex-col gap-6 overflow-hidden" style={{ marginTop: '-110px' }}>
                      <div className="animate-marquee-downward flex flex-col items-center gap-6">
                        {[6, 7, 8, 9, 10].map((num) => (
                          <img 
                            key={`nft-${num}`}
                            src={`/assets/images/nfts/nft${num}.png`}
                            alt=""
                            className="h-[220px] w-[220px] rounded-xl object-cover"
                          />
                        ))}
                        {/* Duplicate để tạo liên tục */}
                        {[6, 7, 8, 9, 10].map((num) => (
                          <img 
                            key={`nft-dup-${num}`}
                            src={`/assets/images/nfts/nft${num}.png`}
                            alt=""
                            className="h-[220px] w-[220px] rounded-xl object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <style jsx>{`
                    @keyframes marquee-upward {
                      from { transform: translateY(0); }
                      to { transform: translateY(-50%); }
                    }
                    
                    @keyframes marquee-downward {
                      from { transform: translateY(-50%); }
                      to { transform: translateY(0); }
                    }
                    
                    .animate-marquee-upward {
                      animation: marquee-upward 40s linear infinite;
                    }
                    
                    .animate-marquee-downward {
                      animation: marquee-downward 40s linear infinite;
                    }
                  `}</style>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

<style jsx>{`
  @keyframes marquee {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes marquee-reverse {
    0% { transform: translateY(-50%); }
    100% { transform: translateY(0); }
  }
  .animate-marquee {
    animation: marquee 20s linear infinite;
  }
  .animate-marquee-reverse {
    animation: marquee-reverse 20s linear infinite;
  }
`}</style>