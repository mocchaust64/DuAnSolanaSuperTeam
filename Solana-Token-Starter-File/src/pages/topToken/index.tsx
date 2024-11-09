import React, { FC, useState, useEffect, useCallback } from 'react';
import { notify } from '../../utils/notifications';
import { useConnection } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { AppBar } from '../../components/AppBar';
import { Footer } from '../../components/Footer';
import { useRouter } from 'next/router';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number; // Vốn hóa thị trường
  total_volume: number; // Khối lượng giao dịch
  price_change_percentage_24h: number; // Thay đổi giá 24h
  image: string; // Hình ảnh logo
}

const TopTokens: FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const { connection } = useConnection();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();

  const fetchTopTokens = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=21&page=${currentPage}&sparkline=false`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTokens(data);
        const totalCoins = 100; // Thay đổi giá trị này nếu bạn biết tổng số coin
        setTotalPages(Math.ceil(totalCoins / 21)); // Cập nhật totalPages
      } else {
        notify({ 
          type: 'error', 
          message: 'Unexpected data format', 
          description: 'Data is not an array' 
        });
      }
    } catch (error) {
      notify({ 
        type: 'error', 
        message: 'Failed to fetch top tokens', 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchTopTokens();
  }, [fetchTopTokens]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col bg-black bg-opacity-90 min-h-screen">
      <div>
        
      </div>
      <AppBar />
      <div className="flex-grow flex items-center justify-center overflow-y-auto pt-16 pb-16">
        <div className="bg-default-950/90 rounded-xl backdrop-blur-3xl p-8 w-full max-w-7xl mx-4">
          <h2 className="text-3xl font-semibold text-white mb-4">Danh Sách Coin Hàng Đầu</h2>
          {loading ? (
            <div className="text-center py-8 text-lg text-gray-300">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokens.map((token) => (
                <div 
                  key={token.id} 
                  className="bg-default-800 rounded-lg p-6 cursor-pointer hover:bg-blue-600 transition duration-300 ease-in-out"
                  onClick={() => router.push(`/CoinDetail?id=${token.id}`)}
                >
                  <img src={token.image} alt={token.name} className="h-20 w-20 mb-3 mx-auto" />
                  <h3 className="text-lg font-bold text-white text-center">{token.name}</h3>
                  <p className="text-default-200 text-center">{token.symbol.toUpperCase()}</p>
                  <p className="text-default-200 text-center">Giá: ${token.current_price.toFixed(2)}</p>
                  <p className="text-default-200 text-center">Vốn Hóa: ${token.market_cap.toLocaleString()}</p>
                  <p className="text-default-200 text-center">Khối Lượng 24h: ${token.total_volume.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition duration-300 ease-in-out">Previous</button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition duration-300 ease-in-out">Next</button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default TopTokens;