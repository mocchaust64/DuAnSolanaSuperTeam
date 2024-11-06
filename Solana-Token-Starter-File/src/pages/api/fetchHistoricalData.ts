import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { coinId } = req.query;

    // Kiểm tra xem coinId có tồn tại không
    if (!coinId) {
        return res.status(400).json({ error: 'coinId is required' });
    }

    try {
        const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?id=${coinId}&convert=USD`, {
            headers: {
                'X-CMC_PRO_API_KEY': 'a1a646a8-e19e-4398-8ed5-65e0812db372', // Thay bằng API key của bạn
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch historical data' });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error); // Ghi log lỗi để kiểm tra
        res.status(500).json({ error: 'Internal Server Error' });
    }
} 