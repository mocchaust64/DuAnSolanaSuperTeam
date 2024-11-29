import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai'
import { ClipLoader } from 'react-spinners'
import { InputView } from '@/views/input'
import { notify } from '@/utils/notifications'
import { MarketplaceAppBar } from './MarketplaceAppBar'
import NotificationList from '@/components/Notification'
import CreateSVG from '@/components/SVG/CreateSVG'

interface NFTFormData {
  name: string
  symbol: string 
  description: string
  image: File | null
  amount: string // Thêm trường mới
  royalty: string // Thêm trường mới
}

const MintNFT: FC = () => {
  const { connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [mintAddress, setMintAddress] = useState('')
  const [nftData, setNftData] = useState<NFTFormData>({
    name: '',
    symbol: '',
    description: '',
    image: null,
    amount: '', // Giá trị mặc định
    royalty: '' // Giá trị mặc định
  })
  const [previewUrl, setPreviewUrl] = useState('')

  const handleFormFieldChange = (
    fieldName: keyof NFTFormData,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNftData({ ...nftData, [fieldName]: e.target.value })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify({ type: 'error', message: 'File không được quá 5MB' })
        return
      }
      setNftData(prev => ({...prev, image: file}))
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const mintNFT = async () => {
    // Mint logic here
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="relative z-50">
        <MarketplaceAppBar />
      </div>
      
      <div className="relative pt-20">
        <div className="fixed top-0 left-0 w-full z-40">
          <NotificationList />
        </div>

        {loading && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        <div className="relative z-10">
          {!mintAddress ? (
            <section className="container mx-auto px-4 py-8">
              <div className="bg-gray-800/30 rounded-2xl backdrop-blur-xl shadow-xl border border-white/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-500/20">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Left Column */}
                  <div className="p-8 border-r border-white/5">
                    <div className="relative aspect-square rounded-xl overflow-hidden group">
                      {previewUrl ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={previewUrl} 
                            alt="NFT Preview" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          
                          {/* Overlay khi hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* Nút xóa ảnh */}
                            <button
                              onClick={() => {
                                setPreviewUrl('')
                                setNftData(prev => ({...prev, image: null}))
                              }}
                              className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors duration-300"
                            >
                              <svg 
                                className="w-6 h-6 text-white" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M6 18L18 6M6 6l12 12" 
                                />
                              </svg>
                            </button>

                            {/* Nút thay đổi ảnh */}
                            <label 
                              htmlFor="nft-image" 
                              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 transition-colors duration-300 cursor-pointer"
                            >
                              Thay đổi ảnh
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700/30 to-gray-600/30 hover:from-gray-700/40 hover:to-gray-600/40 transition-colors duration-300">
                          <label 
                            htmlFor="nft-image" 
                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                          >
                            <div className="p-6 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                              <AiOutlineCloudUpload className="w-12 h-12 text-purple-500" />
                            </div>
                            <p className="mt-4 text-white/70 group-hover:text-white text-center px-4">
                              Kéo thả hoặc click để tải lên hình ảnh NFT
                              <span className="block mt-2 text-sm text-white/50">
                                Hỗ trợ: JPG, PNG, GIF (Max 5MB)
                              </span>
                            </p>
                            <input 
                              type="file"
                              id="nft-image"
                              className="hidden"
                              onChange={handleImageChange}
                              accept="image/*"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-8">
                    {/* Header section với gradient text */}
                    <div className="text-center mb-12">
                      <h4 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Tạo NFT Mới
                      </h4>
                      <p className="mt-4 text-gray-300 max-w-lg mx-auto">
                        Chuyển đổi tác phẩm nghệ thuật của bạn thành NFT độc đáo trên Solana. 
                        Bắt đầu hành trình sáng tạo của bạn ngay hôm nay!
                      </p>
                    </div>

                    {/* Input fields */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="group">
                        <InputView
                          name="Tên NFT"
                          placeholder="Nhập tên NFT"
                          clickhandle={(e) => handleFormFieldChange("name", e)}
                        />
                        <div className="h-0.5 w-0 group-hover:w-full bg-purple-500 transition-all duration-300"></div>
                      </div>

                      <div className="group">
                        <InputView
                          name="Symbol"
                          placeholder="Nhập symbol"
                          clickhandle={(e) => handleFormFieldChange("symbol", e)}
                        />
                        <div className="h-0.5 w-0 group-hover:w-full bg-purple-500 transition-all duration-300"></div>
                      </div>

                      <div className="group">
                        <InputView
                          name="Số lượng"
                          placeholder="Nhập số lượng"
                          clickhandle={(e) => handleFormFieldChange("amount", e)}
                        />
                        <div className="h-0.5 w-0 group-hover:w-full bg-purple-500 transition-all duration-300"></div>
                      </div>

                      <div className="group">
                        <InputView
                          name="Royalty"
                          placeholder="Nhập % royalty"
                          clickhandle={(e) => handleFormFieldChange("royalty", e)}
                        />
                        <div className="h-0.5 w-0 group-hover:w-full bg-purple-500 transition-all duration-300"></div>
                      </div>

                      <div className="col-span-2">
                        <textarea
                          value={nftData.description}
                          onChange={(e) => handleFormFieldChange("description", e)}
                          className="w-full h-32 rounded-xl bg-gray-700/30 border border-white/5 p-4 
                          text-white placeholder-white/30 
                          focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                          transition-all duration-300
                          hover:bg-gray-700/40
                          resize-none" // Thêm để không resize được
                          placeholder="Mô tả về NFT của bạn"
                        />
                        <div className="mt-2 text-xs text-gray-400">
                          Mô tả chi tiết về NFT giúp người mua hiểu rõ hơn về sản phẩm của bạn
                        </div>
                      </div>
                    </div>

                    {/* Description section */}
                    <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                      <h5 className="text-lg font-semibold text-purple-400 mb-4">
                        Hướng dẫn tạo NFT
                      </h5>
                      <div className="space-y-3 text-gray-300">
                        <p>🎨 <span className="text-white">Tên NFT:</span> Đặt tên độc đáo để NFT của bạn nổi bật</p>
                        <p>💎 <span className="text-white">Symbol:</span> Tạo ký hiệu ngắn gọn (3-5 ký tự)</p>
                        <p>📊 <span className="text-white">Số lượng:</span> Số lượng NFT bạn muốn tạo</p>
                        <p>💰 <span className="text-white">Royalty:</span> % lợi nhuận từ giao dịch thứ cấp (0-100%)</p>
                      </div>
                    </div>

                    {/* Mint button */}
                    <button
                      onClick={mintNFT}
                      disabled={loading || !nftData.image}
                      className={`
                        relative overflow-hidden w-full py-4 rounded-xl font-bold text-lg
                        transition-all duration-300 transform
                        ${loading || !nftData.image
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'
                        }
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
                        before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
                      `}
                    >
                      {loading ? 'Đang xử lý...' : 'Tạo NFT'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="container mx-auto px-4">
              <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
                <div className="grid gap-10 lg:grid-cols-2">
                  <div className="lg:ps-0 flex h-full flex-col p-10">
                    <div className="my-auto pb-6 text-center">
                      <h4 className="mb-4 text-2xl font-bold text-white">
                        NFT đã được tạo thành công!
                      </h4>
                      
                      <div className="flex items-start justify-center">
                        <img
                          src={previewUrl}
                          alt="NFT"
                          className="h-40 rounded-lg"
                        />
                      </div>

                      <div className="mt-5 w-full">
                        <InputView
                          name="Địa chỉ NFT"
                          placeholder={mintAddress}
                        />

                        <p className="text-default-300 text-base font-medium leading-6 mt-4">
                          <span>Mô tả: {nftData.description || "Chưa có mô tả"}</span>
                        </p>

                        <a
                          href={`https://explorer.solana.com/address/${mintAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                        >
                          Xem trên Solana Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default MintNFT