import { ApiRoute } from '@/lib/next';
import { getSessionId } from '@/lib/session';
import ShopService, { includeDiscountsOnShop } from '@/services/ShopService';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { Address } from 'viem';

export default ApiRoute(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { shopId, includeDiscounts, walletAddress } = req.query;
  const userId = getSessionId(req);

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (typeof shopId !== 'string')
    return res.status(400).json({ error: 'Invalid shopId' });

  const shop = await ShopService.findById(shopId as UUID);
  if (!shop)
    return res.status(404).json({ error: `Shop with id ${shopId} not found` });

  if (includeDiscounts === 'true') {
    return res.status(200).json(
      await includeDiscountsOnShop(shop, {
        walletAddress: walletAddress as Address,
        userId,
      }),
    );
  }
  return res.status(200).json(shop);
}, 'shops/[shopId]');
