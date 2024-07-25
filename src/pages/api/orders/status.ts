import { sqlDatabase } from '@/infras/database';
import { withErrorHandling } from '@/lib/next';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const orderId = req.body.orderId as UUID;

  if (!orderId || req.method !== 'POST')
    return res.status(400).json({ error: 'Bad request' });

  await sqlDatabase.orders
    .checkStatus(orderId)
    .then(order => res.status(200).json(order))
    .catch(error =>
      res
        .status(500)
        .json({ error: 'Internal server error: ' + error.message }),
    );
}, 'Order Status');
