import { withErrorHandling } from '@/lib/next';
import ShopService from '@/services/ShopService';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const shops = await ShopService.findAll();
  return res.status(200).json(shops);
}, 'shops');
