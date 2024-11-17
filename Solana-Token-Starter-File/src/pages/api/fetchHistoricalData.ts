import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { coinId, days = 30 } = req.query;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data from CoinGecko');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching historical data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}