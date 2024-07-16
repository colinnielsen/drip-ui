import { database } from '@/infras/database';
import { isUUID } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof id !== 'string' || !isUUID(id)) {
    return res.status(400).json({ error: 'Invalid farmerId' });
  }

  try {
    const farmer = await database.farmers.findById(id);
    if (!farmer) {
      return res.status(404).json({ error: `Farmer with id ${id} not found` });
    }
    return res.status(200).json(farmer);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch farmer' });
  }
}
