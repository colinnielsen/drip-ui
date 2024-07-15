import { database } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    try {
      const cafes = await database.cafes.findAll();
      res.status(200).json(cafes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cafes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
