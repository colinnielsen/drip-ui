import { sqlDatabase } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';
import { UUID } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { shopId } = req.query;

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (typeof shopId !== 'string')
    return res.status(400).json({ error: 'Invalid shopId' });

  const shop = await sqlDatabase.shops.findById(shopId as UUID);
  if (!shop)
    return res.status(404).json({ error: `Shop with id ${shopId} not found` });

  return res.status(200).json(shop);
}
