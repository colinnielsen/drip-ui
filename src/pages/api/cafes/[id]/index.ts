import { database } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';
import { isUUID } from '@/lib/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof id !== 'string' || !isUUID(id)) {
    return res.status(400).json({ error: 'Invalid cafeId' });
  }

  try {
    const cafe = await database.cafes.findById(id);
    if (!cafe) {
      return res.status(404).json({ error: `Cafe with id ${id} not found` });
    }
    return res.status(200).json(cafe);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch cafe' });
  }
}
