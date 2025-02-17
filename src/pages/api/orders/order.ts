import { UUID } from '@/data-model/_common/type/CommonType';
import { UserId } from '@/data-model/user/UserType';
import { ApiRoute } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import { authenticationService } from '@/services/AuthenticationService';
import OrderService from '@/services/OrderService';
import { NextApiRequest, NextApiResponse } from 'next';

export default ApiRoute(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await authenticationService.checkAuthentication_sync(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { orderId } = req.query;

  if (orderId !== undefined && !isUUID(orderId))
    return res.status(400).json({ error: 'Invalid orderId' });

  switch (req.method) {
    case 'GET':
      return orderId
        ? handleGetOrder(res, user.id, orderId)
        : handleGetOrders(res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}, 'orders/order');

async function handleGetOrder(
  res: NextApiResponse,
  userId: UserId,
  orderId: UUID,
) {
  try {
    const order = await OrderService.findById(orderId);
    if (order && order.user !== userId)
      return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch cart: ' + error });
  }
}

async function handleGetOrders(res: NextApiResponse, userId: UUID) {
  try {
    const orders = await OrderService.getOrdersByUserId(userId);
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders: ' + error });
  }
}
