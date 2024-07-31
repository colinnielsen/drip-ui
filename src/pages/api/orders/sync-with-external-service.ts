import { sqlDatabase } from '@/infras/database';
import { withErrorHandling } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const orderIds = req.body.orderIds as UUID[];
  if (!orderIds || req.method !== 'POST' || !orderIds.every(isUUID))
    return res.status(400).json({ error: 'Bad request' });

  await sqlDatabase.orders
    .syncWithExternalService(orderIds)
    .then(orders => res.status(200).json(orders))
    .catch(error =>
      res
        .status(500)
        .json({ error: 'Internal server error: ' + error.message }),
    );
}, 'orders/sync-with-external-service');
