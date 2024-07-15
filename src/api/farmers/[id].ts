import { database } from '@/infras/database';
import { isUUID } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      if (typeof id !== 'string' || !isUUID(id)) {
        res.status(400).json({ error: 'Invalid farmerId' });
        return;
      }
      const farmer = await database.farmers.findById(id);
      if (!farmer) {
        res.status(404).json({ error: `Farmer with id ${id} not found` });
      } else {
        res.status(200).json(farmer);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch farmer' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
