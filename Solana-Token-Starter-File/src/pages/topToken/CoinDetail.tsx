import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { notify } from '../../utils/notifications';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { AppBar } from '../../components/AppBar';
import { ApexOptions } from 'apexcharts';

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
    description: {
        en: string;
    };
}

const CoinDetail = () => {
    const router = useRouter();
    const { id } = router.query; // Lấy id từ query parameters
    const [coinData, setCoinData] = useState<CoinData | null>(null);
    const [loading, setLoading] = useState(true);
    const [historicalData, setHistoricalData] = useState([]); // Dữ liệu lịch sử giá
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all');
    const [selectedPeriod, setSelectedPeriod] = useState('24h');

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
            console.log(data.prices); // Kiểm tra dữ liệu nhận được
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
            (filter === 'increase' && coin.market_data.price_change_percentage_24h > 0) || 
            (filter === 'decrease' && coin.market_data.price_change_percentage_24h < 0);
        return matchesSearch && matchesFilter;
    }) : [];

    const chartOptions: ApexOptions = {
        chart: {
            type: 'area',
            zoom: {
                enabled: true
            },
            toolbar: {
                show: false
            },
            background: 'transparent',
        },
        colors: ['#3b82f6'], // Blue color
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        grid: {
            show: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            strokeDashArray: 3,
            position: 'back'
        },
        xaxis: {
            type: 'datetime',
            labels: {
                style: {
                    colors: '#9ca3af'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            show: false // Hide y-axis labels
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            x: {
                show: true,
                format: 'dd MMM yyyy'
            },
            y: {
                formatter: function(value: number) {
                    return `$${value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`
                }
            }
        }
    };

    const chartData = [{
        name: 'Giá',
        data: historicalData
    }];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900">
            <AppBar />
            
            <div className="relative pt-20 pb-16 px-4">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-40 left-20 w-72 h-72 bg-blue-500/30 rounded-full filter blur-[100px]" />
                    <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/30 rounded-full filter blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="relative w-20 h-20">
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full animate-ping" />
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        </div>
                    ) : coinData && (
                        <>
                            {/* Hero Section */}
                            <div className="mb-12 text-center">
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <img 
                                        src={coinData.image.large} 
                                        alt={coinData.name}
                                        className="w-20 h-20 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300"
                                    />
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        {coinData.name}
                                    </h1>
                                </div>
                                
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                                    <span className="text-gray-400 mr-2">Rank #{coinData.market_cap_rank}</span>
                                    <span className="text-blue-400 font-medium">{coinData.symbol.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Price Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {[
                                    {
                                        label: 'Current Price',
                                        value: `$${coinData.market_data.current_price.usd.toLocaleString()}`,
                                        change: coinData.market_data.price_change_percentage_24h,
                                    },
                                    {
                                        label: 'Market Cap',
                                        value: `$${coinData.market_data.market_cap.usd.toLocaleString()}`,
                                    },
                                    {
                                        label: '24h Volume',
                                        value: `$${coinData.market_data.total_volume.usd.toLocaleString()}`,
                                    },
                                    {
                                        label: 'Circulating Supply',
                                        value: `${coinData.market_data.circulating_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}`,
                                    },
                                ].map((item, index) => (
                                    <div key={index} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 
                                        hover:border-blue-500/50 transition-all duration-300 group">
                                        <h3 className="text-gray-400 mb-2">{item.label}</h3>
                                        <div className="text-xl font-semibold text-white">
                                            {item.value}
                                            {item.change && (
                                                <span className={`ml-2 text-sm ${
                                                    item.change > 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change).toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart Section */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-12">
                                <div className="mb-6 flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-white">Price Chart</h2>
                                    <div className="flex gap-2">
                                        {['24h', '7d', '30d', '1y'].map((period) => (
                                            <button
                                                key={period}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 
                                                    ${selectedPeriod === period 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => setSelectedPeriod(period)}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="h-[400px]">
                                    <Chart 
                                        options={chartOptions}
                                        series={chartData}
                                        type="area"
                                        height="100%"
                                    />
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h2 className="text-2xl font-bold text-white mb-4">About {coinData.name}</h2>
                                <div 
                                    className="text-gray-300 prose prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: coinData.description.en }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoinDetail;
