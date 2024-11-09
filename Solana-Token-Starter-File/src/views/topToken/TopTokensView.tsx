import React, { FC, useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { notify } from '../../utils/notifications';
import { AiOutlineSearch, AiOutlineFilter } from 'react-icons/ai';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

interface TokenData {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  change24h: number;
  logo: string;
  address: string;
}

interface TokenFilters {
  search: string;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume: number;
  maxVolume: number;
}

const TopTokensView: FC = () => {
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
  const [filters, setFilters] = useState<TokenFilters>({
    search: '',
    minMarketCap: 0,
    maxMarketCap: Infinity,
    minVolume: 0,
    maxVolume: Infinity,
  });
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  const fetchTopTokens = useCallback(async () => {
    setLoading(true);
    try {
      // This is a placeholder. You'll need to implement the actual API call
      const response = await fetch('https://api.solana.com/v1/tokens/top');
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      notify({ type: 'error', message: 'Failed to fetch top tokens', description: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopTokens();
  }, [fetchTopTokens]);

  const handleSort = (key: keyof TokenData) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    token.symbol.toLowerCase().includes(filters.search.toLowerCase())
  ).filter(token => 
    token.marketCap >= filters.minMarketCap &&
    token.marketCap <= filters.maxMarketCap &&
    token.volume24h >= filters.minVolume &&
    token.volume24h <= filters.maxVolume
  );

  const sortedTokens = filteredTokens.sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = sortedTokens.slice(indexOfFirstToken, indexOfLastToken);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const TokenRow: FC<{ token: TokenData }> = ({ token }) => (
    <tr className="hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedToken(token)}>
      <td className="px-6 py-4 whitespace-nowrap">{token.rank}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full" src={token.logo} alt={token.name} />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{token.name}</div>
            <div className="text-sm text-gray-500">{token.symbol}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">${token.price.toFixed(2)}</td>
      <td className={`px-6 py-4 whitespace-nowrap ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {token.change24h.toFixed(2)}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap">${token.marketCap.toLocaleString()}</td>
      <td className="px-6 py-4 whitespace-nowrap">${token.volume24h.toLocaleString()}</td>
      <td className="px-6 py-4 whitespace-nowrap">{token.circulatingSupply.toLocaleString()} {token.symbol}</td>
    </tr>
  );

  const TokenDetailsModal: FC = () => {
    if (!selectedToken) return null;

    return (
      <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {selectedToken.name} ({selectedToken.symbol})
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Price: ${selectedToken.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Market Cap: ${selectedToken.marketCap.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">24h Volume: ${selectedToken.volume24h.toLocaleString()}</p>
                    <p className=" text-sm text-gray-500">Circulating Supply: {selectedToken.circulatingSupply.toLocaleString()} {selectedToken.symbol}</p>
                    <p className="text-sm text-gray-500">24h Change: {selectedToken.change24h.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setSelectedToken(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Top Tokens</h1>
      <div className="flex mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search by name or symbol"
          className="border rounded p-2 mr-2"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <button className="bg-blue-500 text-white rounded p-2" onClick={() => fetchTopTokens()}>
          <AiOutlineSearch />
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center">
          <ClipLoader loading={loading} size={50} />
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => handleSort('rank')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank <FaSort /></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
              <th onClick={() => handleSort('price')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price <FaSort /></th>
              <th onClick={() => handleSort('change24h')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change <FaSort /></th>
              <th onClick={() => handleSort('marketCap')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap <FaSort /></th>
              <th onClick={() => handleSort('volume24h')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Volume <FaSort /></th>
              <th onClick={() => handleSort('circulatingSupply')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Circulating Supply <FaSort /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentTokens.map(token => (
              <TokenRow key={token.address} token={token} />
            ))}
          </tbody>
        </table>
      )}
      <TokenDetailsModal />
      <div className="flex justify-between mt-4">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="bg-gray-300 rounded p-2">Previous</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage * tokensPerPage >= sortedTokens.length} className="bg-gray-300 rounded p-2">Next</button>
      </div>
    </div>
  );
};

export default TopTokensView;