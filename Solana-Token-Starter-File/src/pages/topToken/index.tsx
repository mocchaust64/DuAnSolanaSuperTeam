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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900">
      <AppBar />
      
      <div className="flex-grow pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Top Cryptocurrency List
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore the world's leading digital assets ranked by market capitalization
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokens.map((token) => (
                <div 
                  key={token.id}
                  onClick={() => router.push(`/topToken/CoinDetail?id=${token.id}`)}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 
                    border border-white/10 hover:border-blue-500/50
                    transform hover:scale-[1.02] transition-all duration-300
                    cursor-pointer overflow-hidden"
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <img 
                      src={token.image} 
                      alt={token.name} 
                      className="h-24 w-24 mb-4 mx-auto transform group-hover:scale-110 transition-transform duration-300" 
                    />
                    
                    <h3 className="text-xl font-bold text-white text-center mb-2">
                      {token.name}
                    </h3>
                    
                    <p className="text-blue-400 text-center font-medium mb-4">
                      {token.symbol.toUpperCase()}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">Price</span>
                        <span className="text-white font-medium">
                          ${token.current_price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">Market Cap</span>
                        <span className="text-white font-medium">
                          ${token.market_cap.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">24h Volume</span>
                        <span className="text-white font-medium">
                          ${token.total_volume.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/5">
                        <span className="text-gray-400">24h Change</span>
                        <span className={`font-medium ${
                          token.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {token.price_change_percentage_24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center mt-12 gap-4">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              className={`px-6 py-3 rounded-xl font-semibold text-white
                transform transition-all duration-300
                ${currentPage === 1 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105'
                }`}
            >
              Previous
            </button>
            
            <span className="flex items-center text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
              className={`px-6 py-3 rounded-xl font-semibold text-white
                transform transition-all duration-300
                ${currentPage === totalPages 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTokens;