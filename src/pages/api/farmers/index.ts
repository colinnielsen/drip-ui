import FarmerService from '@/services/FarmerService';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const farmers = await FarmerService.findAll();
    return res.status(200).json(farmers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch farmers' });
  }
}
