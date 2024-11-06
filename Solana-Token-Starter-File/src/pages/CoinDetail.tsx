import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { notify } from '../utils/notifications';
import Chart from 'react-apexcharts';
import { AppBar } from '../components/AppBar';

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
}

const CoinDetail = () => {
    const router = useRouter();
    const { id } = router.query; // Lấy id từ query parameters
    const [coinData, setCoinData] = useState<CoinData | null>(null);
    const [loading, setLoading] = useState(true);
    const [historicalData, setHistoricalData] = useState([]); // Dữ liệu lịch sử giá

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
            },
            title: {
                text: 'Biểu Đồ Lịch Sử Giá',
                align: 'left' as 'left',
            },
        },
    };

    return (
        <div className="px-12 py-8 flex flex-col bg-gray-80 rounded-lg shadow-md">
              <AppBar />
            {/* Phần tiêu đề */}
            <div className="flex items-center mb-6">
                <img className="w-20 mr-4" src={coinData?.image.large} alt={coinData?.name} />
                <div>
                    <h1 className="text-3xl font-bold text-white">{coinData?.name} - {coinData?.symbol.toUpperCase()}</h1>
                    <p className="text-lg font-bold text-black">Rank: {coinData?.market_cap_rank}</p>
                    <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg">Thêm vào danh sách yêu thích</button>
                </div>
            </div>

            {/* Thông tin giá */}
            <div className="flex justify-between mb-6">
                <p className="text-2xl font-bold text-white">Giá Hiện Tại: <span className="font-semibold">${coinData?.market_data.current_price.usd}</span></p>
                <p className="text-lg font-bold text-black">Tăng/Giảm 24h: <span className={`font-semibold ${coinData?.market_data.price_change_percentage_24h < 0 ? 'text-red-500' : 'text-green-500'}`}>{coinData?.market_data.price_change_percentage_24h}%</span></p>
            </div>

            {/* Biểu đồ giá */}
            <div className="flex-1 border border-gray-300 p-4 rounded-lg bg-white shadow-sm mb-6">
                <Chart options={chartData.options} series={chartData.series} type="line" height={350} />
                {/* Bộ lọc thời gian cho biểu đồ */}
                <div className="flex justify-center mt-2">
                    <button className="mx-2 px-3 py-1 border rounded-lg">1 ngày</button>
                    <button className="mx-2 px-3 py-1 border rounded-lg">7 ngày</button>
                    <button className="mx-2 px-3 py-1 border rounded-lg">1 tháng</button>
                    <button className="mx-2 px-3 py-1 border rounded-lg">1 năm</button>
                </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <p className="font-bold text-black">Khối Lượng Giao Dịch 24h:</p>
                    <p className="font-semibold">${coinData?.market_data.total_volume.usd}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <p className="font-bold text-black">Tổng Cung:</p>
                    <p className="font-semibold">{coinData?.market_data.total_supply}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <p className="font-bold text-black">Lượng Cung Lưu Hành:</p>
                    <p className="font-semibold">{coinData?.market_data.circulating_supply}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <p className="font-bold text-black">Tỷ Lệ Thay Đổi 24h:</p>
                    <p className="font-semibold">{coinData?.market_data.price_change_percentage_24h}%</p>
                </div>
            </div>
        </div>
    );
};

export default CoinDetail; 