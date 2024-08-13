import { sqlDatabase } from '@/infras/database';
import { NextApiRequest, NextApiResponse } from 'next';
import { UUID } from 'crypto';
import { withErrorHandling } from '@/lib/next';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { includeDiscountsOnShop } from '@/services/ShopService';
import { Address } from 'viem';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { shopId, includeDiscounts, walletAddress } = req.query;
  const userId = req.cookies[SESSION_COOKIE_NAME];

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (typeof shopId !== 'string')
    return res.status(400).json({ error: 'Invalid shopId' });

  const shop = await sqlDatabase.shops.findById(shopId as UUID);
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
