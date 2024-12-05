import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { objectType, designStyle, color, lighting, specialEffects } = req.body;

    // Gọi mô hình AI để tạo ảnh 3D
    try {
      const imageBuffer = await generate3DImageWithAI({
        objectType,
        designStyle,
        color,
        lighting,
        specialEffects,
      });

      res.setHeader('Content-Type', 'image/png'); // Đặt header cho loại nội dung
      res.status(200).send(imageBuffer); // Gửi buffer ảnh trực tiếp
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate 3D image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Hàm gọi mô hình AI
async function generate3DImageWithAI(params: any): Promise<Buffer> {
  const data = {
    inputs: `${params.objectType}, ${params.designStyle}, ${params.color}, ${params.lighting}, ${params.specialEffects}`,
  };

  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error from AI service:', errorData);
    throw new Error(`Failed to generate image: ${errorData.error || 'Unknown error'}`);
  }

  const result = await response.arrayBuffer(); // Lấy dữ liệu dưới dạng ArrayBuffer
  return Buffer.from(result); // Chuyển đổi ArrayBuffer thành Buffer
}