import { UUID } from '@/data-model/_common/type/CommonType';
import { ApiRoute } from '@/lib/next';
import ShopService from '@/services/ShopService';
import { NextApiRequest, NextApiResponse } from 'next';

export default ApiRoute(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { shopId } = req.query;

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (typeof shopId !== 'string')
    return res.status(400).json({ error: 'Invalid shopId' });

  const shop = await ShopService.findById(shopId as UUID);
  if (!shop)
    return res.status(404).json({ error: `Shop with id ${shopId} not found` });

  return res.status(200).json(shop);
}, 'shops/[shopId]');
