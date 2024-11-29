import NotificationList from '../../components/Notification'
import React, { useState } from 'react'
import { AiOutlineClose } from 'react-icons/ai'

const ThreeDImageGenerator = ({ setOpen3DImageGenerator }) => {
  const [objectType, setObjectType] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [color, setColor] = useState('');
  const [lighting, setLighting] = useState('');
  const [specialEffects, setSpecialEffects] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleGenerateImage = async () => {
    console.log('Generating image with parameters:', { objectType, designStyle, color, lighting, specialEffects });

    setLoading(true);
    setMessage('');

    const response = await fetch('/api/generate3DImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectType,
        designStyle,
        color,
        lighting,
        specialEffects,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error.includes('Max requests total reached')) {
        setMessage("Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một phút trước khi thử lại.");
        setMessageType('error');
      } else {
        console.error('Error generating image:', response.statusText);
        setMessage("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau 1 phút.");
        setMessageType('error');
      }
      return;
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    setPreviewImage(imageUrl);

    setMessage("Tạo ảnh 3D thành công!");
    setMessageType('success');

    setObjectType('');
    setDesignStyle('');
    setColor('');
    setLighting('');
    setSpecialEffects('');
  };

  return (
    <>
      <NotificationList />
      {/* Backdrop với blur và gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-gray-900/50 to-pink-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
        {/* Main container */}
        <div className="relative w-full max-w-2xl bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-2xl 
          shadow-[0_0_40px_rgba(139,92,246,0.1)] border border-white/10 backdrop-blur-xl
          transform transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.2)]">
          
          {/* Close button */}
          <button 
            onClick={() => setOpen3DImageGenerator(false)}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500/80 hover:bg-red-500 
              transition-colors duration-300 group z-10"
          >
            <AiOutlineClose className="w-5 h-5 text-white transform group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="p-8 max-h-[90vh] overflow-y-auto">
            {/* Header with animated gradient */}
            <div className="text-center mb-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 
                animate-gradient-x blur-2xl opacity-50" />
              <img 
                src="/assets/images/logo1.png"
                alt="Logo"
                className="w-16 h-16 mx-auto mb-6 transform hover:scale-110 transition-transform duration-300"
              />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 
                bg-clip-text text-transparent mb-3">
                Tạo Ảnh 3D
              </h2>
              <p className="text-gray-300 text-lg">
                Khám phá khả năng sáng tạo với công nghệ AI
              </p>
            </div>

            {/* Form with enhanced styling */}
            <div className="space-y-8">
              {[
                { 
                  label: 'Loại đối tượng', 
                  value: objectType, 
                  setter: setObjectType, 
                  placeholder: 'Ex: CryptoPunk, Bored Ape, Digital Art Piece...' 
                },
                { 
                  label: 'Phong cách thiết kế', 
                  value: designStyle, 
                  setter: setDesignStyle, 
                  placeholder: 'Ex: Voxel Art, Pixel Art, Abstract Digital...' 
                },
                { 
                  label: 'Màu sắc', 
                  value: color, 
                  setter: setColor, 
                  placeholder: 'Ex: Crypto Blue, NFT Purple, Digital Gold...' 
                },
                { 
                  label: 'Ánh sáng', 
                  value: lighting, 
                  setter: setLighting, 
                  placeholder: 'Ex: Blockchain Glow, Metaverse Light, Digital Rays...' 
                },
                { 
                  label: 'Hiệu ứng đặc biệt', 
                  value: specialEffects, 
                  setter: setSpecialEffects, 
                  placeholder: 'Ex: Token Shine, Crypto Sparkle, NFT Hologram...' 
                }
              ].map((field, index) => (
                <div key={index} className="group relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2 ml-1 transition-colors group-hover:text-purple-400">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-5 py-3 bg-gray-700/30 border border-white/10 rounded-xl
                      text-white placeholder-gray-400/70
                      focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
                      hover:bg-gray-700/40 transition-all duration-300"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 
                    w-0 group-hover:w-full transition-all duration-500" />
                </div>
              ))}

              {/* Generate button with animation */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleGenerateImage}
                  disabled={loading}
                  className="relative px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 
                    rounded-xl font-semibold text-white text-lg
                    shadow-[0_0_20px_rgba(139,92,246,0.3)]
                    hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                    transform hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-300 disabled:opacity-50 
                    disabled:cursor-not-allowed disabled:hover:scale-100
                    group overflow-hidden"
                >
                  <span className="relative z-10">
                    {loading ? 'Đang tạo...' : 'Tạo ảnh 3D'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                    translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </button>
              </div>

              {/* Loading animation */}
              {loading && (
                <div className="flex items-center justify-center gap-3 text-white py-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-lg animate-pulse">Đang tạo ảnh tuyệt đẹp của bạn...</span>
                </div>
              )}

              {/* Status message */}
              {message && (
                <div className={`p-5 rounded-xl text-center text-lg font-medium transform transition-all duration-300 
                  ${messageType === 'success' 
                    ? 'bg-green-500/20 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                    : 'bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  }`}>
                  {message}
                </div>
              )}

              {/* Preview image with enhanced animation */}
              {previewImage && (
                <div className="mt-8 rounded-xl overflow-hidden bg-gradient-to-b from-gray-700/30 to-gray-800/30 p-3
                  transform hover:scale-[1.02] transition-all duration-500 group">
                  <img 
                    src={previewImage} 
                    alt="Preview 3D" 
                    className="w-full h-auto rounded-lg transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ThreeDImageGenerator