import { database } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cafes = await database.cafes.findAll();
    return res.status(200).json(cafes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch cafes' });
  }
}
