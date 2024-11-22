import NotificationList from '../../components/Notification';
import React, { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50 }}>
        <div className="scrollable" style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', borderRadius: '1rem', padding: '2rem', maxWidth: '40rem', width: '100%', backdropFilter: 'blur(10px)', overflowY: 'auto', maxHeight: '100vh' }}>
          <button onClick={() => setOpen3DImageGenerator(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white' }}>
            <AiOutlineClose size={24} />
          </button>
          <img 
            src="/assets/images/logo1.png" // Đường dẫn đến logo
            alt="Logo"
            style={{ width: '50px', height: '50px', marginBottom: '1rem', display: 'block', marginLeft: '5px', marginRight: 'auto' }} // Điều chỉnh kích thước và căn giữa
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: '1.5rem' }}>Tạo Ảnh 3D</h2>
          <p style={{ color: 'white', textAlign: 'center', marginBottom: '1rem' }}>Vui lòng nhập thông tin chi tiết cho ảnh 3D của bạn.</p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>Loại đối tượng:</label>
            <input
              type="text"
              value={objectType}
              onChange={(e) => setObjectType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              placeholder="Nhập loại đối tượng"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>Phong cách thiết kế:</label>
            <input
              type="text"
              value={designStyle}
              onChange={(e) => setDesignStyle(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              placeholder="Nhập phong cách thiết kế"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>Màu sắc:</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              placeholder="Nhập màu sắc"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>Ánh sáng:</label>
            <input
              type="text"
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              placeholder="Nhập ánh sáng"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>Hiệu ứng đặc biệt:</label>
            <input
              type="text"
              value={specialEffects}
              onChange={(e) => setSpecialEffects(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              placeholder="Nhập hiệu ứng đặc biệt"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              onClick={handleGenerateImage}
              style={{
                width: '30%',
                backgroundColor: '#6B46C1',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.4rem',
                borderRadius: '0.8rem',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5A3EAB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6B46C1'}
            >
              Tạo ảnh 3D
            </button>
          </div>
          {loading && <p style={{ color: 'white', textAlign: 'center', marginTop: '1rem' }}>Đang tạo ảnh, vui lòng chờ...</p>}
          {message && (
            <p style={{ 
              color: messageType === 'success' ? 'green' : 'red',
              textAlign: 'center', 
              marginTop: '1rem' 
            }}>
              {message}
            </p>
          )}
          {previewImage && (
            <img src={previewImage} alt="Preview 3D" style={{ marginTop: '1rem', width: '100%', height: 'auto', borderRadius: '0.5rem' }} />
          )}
        </div>
      </div>
    </>
  );
};

export default ThreeDImageGenerator;