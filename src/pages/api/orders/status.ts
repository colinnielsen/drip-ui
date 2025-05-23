import { ApiRoute } from '@/lib/next';
import OrderService from '@/services/OrderService';
import { UUID } from '@/data-model/_common/type/CommonType';
import { NextApiRequest, NextApiResponse } from 'next';

export default ApiRoute(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const orderId = req.body.orderId as UUID;

  if (!orderId || req.method !== 'POST')
    return res.status(400).json({ error: 'Bad request' });

  await OrderService.checkStatus(orderId)
    .then(order => res.status(200).json(order))
    .catch(error =>
      res
        .status(500)
        .json({ error: 'Internal server error: ' + error.message }),
    );
}, 'orders/status');
