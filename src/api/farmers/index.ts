import { database } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    try {
      const farmers = await database.farmers.findAll();
      res.status(200).json(farmers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch farmers' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
