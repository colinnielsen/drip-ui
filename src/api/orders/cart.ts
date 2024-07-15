import { database } from '@/infras/database';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    res.status(400).json({ error: 'Invalid userId' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const cart = await database.order.getActiveUserOrder(userId as UUID);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
