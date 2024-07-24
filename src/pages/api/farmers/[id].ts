import { sqlDatabase } from '@/infras/database';
import { isUUID } from '@/lib/utils';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (typeof id !== 'string')
    return res.status(400).json({ error: 'Invalid farmerId' });

  try {
    const farmer = await sqlDatabase.farmers.findById(id as UUID);
    if (!farmer) {
      return res.status(404).json({ error: `Farmer with id ${id} not found` });
    }
    return res.status(200).json(farmer);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}
