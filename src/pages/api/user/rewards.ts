import { UUID } from '@/data-model/_common/type/CommonType';
import { ApiRoute } from '@/lib/next';
import { authenticationService } from '@/services/AuthenticationService';
import { sql } from '@vercel/postgres';
import { NextApiRequest, NextApiResponse } from 'next';

export type UserReward = {
  orderId: UUID;
  timestamp: string;
  shopName: string;
  shopLogo: string;
  lineItemCount: number;
  tipAmount: number | null;
  rewardAmount: number;
  orderTotal: number;
};

export default ApiRoute(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await authenticationService.checkAuthentication_sync(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await sql`
      SELECT 
        o.id as "orderId",
        o.timestamp,
        s.label as "shopName", 
        s.logo as "shopLogo",
        o."lineItems",
        o.tip,
        o."additionalDistributions",
        o."totalAmount"
      FROM orders o
      JOIN shops s ON o.shop = s.id
      WHERE o.user = ${user.id}
        AND o."additionalDistributions" IS NOT NULL
        -- AND o.status = '3-complete'
      ORDER BY o.timestamp DESC
      LIMIT 50
    `;

    const rewards: UserReward[] = result.rows.map((row: any) => {
      const lineItems = Array.isArray(row.lineItems) ? row.lineItems : [];
      const tip = row.tip;
      const additionalDistributions = row.additionalDistributions;
      const totalAmount = row.totalAmount;

      // Calculate reward amount from additional distributions
      let rewardAmount = 0;
      if (Array.isArray(additionalDistributions)) {
        const rewardDistribution = additionalDistributions.find(
          (dist: any) => dist.__type === 'reward-token-distribution',
        );
        if (rewardDistribution) {
          rewardAmount = rewardDistribution.tokenAmount || 0;
        }
      }

      // Calculate tip amount in cents (converting from USDC format)
      let tipAmount = null;
      if (tip && tip.amount && tip.amount.value) {
        tipAmount = Math.round(tip.amount.value / 10000); // Convert from USDC format to cents
      }

      // Calculate order total in cents
      let orderTotal = 0;
      if (totalAmount && totalAmount.value) {
        orderTotal = Math.round(totalAmount.value / 10000); // Convert from USDC format to cents
      }

      return {
        orderId: row.orderId,
        timestamp: row.timestamp,
        shopName: row.shopName,
        shopLogo: row.shopLogo || '',
        lineItemCount: lineItems.length,
        tipAmount,
        rewardAmount,
        orderTotal,
      };
    });

    return res.status(200).json(rewards);
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}, 'user/rewards');
