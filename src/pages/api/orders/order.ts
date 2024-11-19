import { USDC } from '@/data-model/_common/currency/USDC';
import { withErrorHandling } from '@/lib/next';
import { getSessionId } from '@/lib/session';
import { err, isUUID } from '@/lib/utils';
import OrderService from '@/services/OrderService';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = getSessionId(req);

  if (!userId || !isUUID(userId))
    return res.status(401).json({ error: 'Unauthorized' });

  const { orderId } = req.query;

  if (orderId !== undefined && !isUUID(orderId))
    return res.status(400).json({ error: 'Invalid orderId' });

  switch (req.method) {
    case 'GET':
      return orderId
        ? handleGetOrder(res, orderId)
        : handleGetOrders(res, userId);
    case 'POST':
      return handleUpdateOrder(req, res, userId, orderId);
    case 'DELETE':
      if (!isUUID(orderId))
        return res.status(400).json({ error: 'Invalid orderId' });
      return handleDeleteOrder(res, orderId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}, 'orders/order');

async function handleGetOrder(res: NextApiResponse, orderId: UUID) {
  try {
    const order = await OrderService.findById(orderId);
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

async function handleUpdateOrder(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: UUID,
  orderId?: UUID,
) {
  const { action } = req.body;
  if (!action) return res.status(400).json({ error: 'Missing action' });

  const maybeOrder = orderId ? await OrderService.findById(orderId) : null;

  if (maybeOrder && maybeOrder.status !== '1-pending')
    return res.status(400).json({ error: 'Order is not pending' });

  if (action === 'add') {
    const { orderItems } = req.body;
    if (!maybeOrder && orderId)
      return res.status(400).json({ error: 'Order not found' });

    const updatedOrder = maybeOrder
      ? // if the order exists already
        await OrderService.update(maybeOrder.id, [
          { __type: 'add', orderItem: orderItems },
        ])
      : // if the order does not exist, create a new one
        await OrderService.save(
          req.body.shopId || err('Missing shopId'),
          userId,
          orderItems,
        );
    return res.status(200).json(updatedOrder);
  }

  if (action === 'delete') {
    if (!maybeOrder) return res.status(500).json({ error: 'Order not found' });

    const { orderItemId } = req.body;
    const updatedOrder = await OrderService.update(maybeOrder.id, [
      { __type: 'delete', orderItemId },
    ]);
    return res.status(200).json(updatedOrder);
  }

  if (action === 'tip') {
    if (!maybeOrder) return res.status(400).json({ error: 'Order not found' });

    const { tip } = req.body;
    if (typeof tip === 'number' && tip < 0)
      return res.status(400).json({ error: 'Invalid tip amount' });

    const updatedOrder = await OrderService.update(maybeOrder.id, [
      { __type: 'tip', tip: tip ? { amount: USDC.fromUSD(tip) } : null },
    ]);

    return res.status(200).json(updatedOrder);
  }

  return err('Invalid action');
}

async function handleDeleteOrder(res: NextApiResponse, orderId: UUID) {
  const maybeOrder = await OrderService.findById(orderId);
  if (!maybeOrder) return res.status(404).json({ error: 'Order not found' });

  const clearedOrder = await OrderService.clear(maybeOrder.id);
  return res.status(200).json(clearedOrder);
}
