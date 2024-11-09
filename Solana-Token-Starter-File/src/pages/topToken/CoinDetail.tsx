import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { notify } from '../../utils/notifications';
import Chart from 'react-apexcharts';
import { AppBar } from '../../components/AppBar';

// Định nghĩa kiểu dữ liệu cho coinData
interface CoinData {
    name: string;
    image: {
        large: string;
    };
    market_data: {
        current_price: {
            usd: number;
        };
        market_cap: {
            usd: number;
        };
        total_volume: {
            usd: number;
        };
        circulating_supply: number;
        total_supply: number;
        price_change_percentage_24h: number;
    };
    market_cap_rank: number;
    symbol: string;
}

const CoinDetail = () => {
    const router = useRouter();
    const { id } = router.query; // Lấy id từ query parameters
    const [coinData, setCoinData] = useState<CoinData | null>(null);
    const [loading, setLoading] = useState(true);
    const [historicalData, setHistoricalData] = useState([]); // Dữ liệu lịch sử giá
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all');

    useEffect(() => {
        if (id) {
            fetchCoinData(id);
            fetchHistoricalData(id);
        }
    }, [id]);

    const fetchCoinData = async (coinId) => {
        setLoading(true);
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setCoinData(data);
        } catch (error) {
            notify({ 
                type: 'error', 
                message: 'Failed to fetch coin data', 
                description: error instanceof Error ? error.message : 'Unknown error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoricalData = async (coinId) => {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setHistoricalData(data.prices); // Lưu dữ liệu giá lịch sử
        } catch (error) {
            notify({ 
                type: 'error', 
                message: 'Failed to fetch historical data', 
                description: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    };

    const filteredCoins = coinData ? [coinData].filter(coin => {
        const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || 
            (filter === 'increase' && coinData.market_data.price_change_percentage_24h > 0) || 
            (filter === 'decrease' && coinData.market_data.price_change_percentage_24h < 0);
        return matchesSearch && matchesFilter;
    }) : [];

    if (loading) {
        return <div>Loading...</div>;
    }

    // Chuyển đổi dữ liệu lịch sử giá thành định dạng phù hợp cho biểu đồ
    const chartData = {
        series: [{
            name: 'Giá',
            data: historicalData.map(price => [price[0], price[1]]), // [timestamp, price]
        }],
        options: {
            chart: {
                type: 'line' as 'line',
                height: 350,
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    style: {
                        colors: 'white', // Đổi màu chữ thành trắng
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: 'white', // Đổi màu chữ thành trắng
                    },
                },
            },
            title: {
                text: 'Biểu Đồ Lịch Sử Giá',
                align: 'left' as 'left',
                style: {
                    color: 'white', // Đổi màu tiêu đề thành trắng
                },
            },
        },
    };

    return (
        <>
           <AppBar />
        <div className="px-12 py-8 flex flex-col bg-gray-900 rounded-lg shadow-lg">
           
          <div className='px-12' >
            <div className='px-12'>
                <div className='px-12'>
                    <div className='px-12'>
                        <div className='px-12'>
                    
            {/* Phần tiêu đề */}
         
            <div className="flex items-center mb-6">
            
                <img className="w-24 h-24 mr-4 rounded-full border-2 border-blue-500" src={coinData?.image.large} alt={coinData?.name} />
                <div>
                    <h1 className="text-4xl font-bold text-white">{coinData?.name} - {coinData?.symbol.toUpperCase()}</h1>
                    <p className="text-lg font-bold text-gray-300">Rank: {coinData?.market_cap_rank}</p>
                    <button className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Thêm vào danh sách yêu thích</button>
                </div>
            </div>

            {/* Thông tin giá */}
            <div className="flex justify-between mb-6">
                <p className="text-3xl font-bold text-white">Giá Hiện Tại: <span className="font-semibold text-yellow-400">${coinData?.market_data.current_price.usd}</span></p>
                <p className="text-lg font-bold text-gray-300">Tăng/Giảm 24h: <span className={`font-semibold ${coinData?.market_data.price_change_percentage_24h < 0 ? 'text-red-500' : 'text-green-500'}`}>{coinData?.market_data.price_change_percentage_24h}%</span></p>
            </div>

            {/* Biểu đồ giá */}
            <div className="flex-1 border border-gray-600 p-4 rounded-lg bg-gray-800 shadow-md mb-6">
                <Chart options={chartData.options} series={chartData.series} type="line" height={350} />
                {/* Bộ lọc thời gian cho biểu đồ */}
                <div className="flex justify-center mt-2">
                    <button className="mx-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300">1 ngày</button>
                    <button className="mx-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300">7 ngày</button>
                    <button className="mx-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300">1 tháng</button>
                    <button className="mx-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300">1 năm</button>
                </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <p className="font-bold text-gray-300">Khối Lượng Giao Dịch 24h:</p>
                    <p className="font-semibold text-white">${coinData?.market_data.total_volume.usd}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <p className="font-bold text-gray-300">Tổng Cung:</p>
                    <p className="font-semibold text-white">{coinData?.market_data.total_supply}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <p className="font-bold text-gray-300">Lượng Cung Lưu Hành:</p>
                    <p className="font-semibold text-white">{coinData?.market_data.circulating_supply}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <p className="font-bold text-gray-300">Tỷ Lệ Thay Đổi 24h:</p>
                    <p className="font-semibold text-white">{coinData?.market_data.price_change_percentage_24h}%</p>
                </div>
            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
        </>
    );
};

export default CoinDetail; 
