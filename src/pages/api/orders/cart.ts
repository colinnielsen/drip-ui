import { sqlDatabase } from '@/infras/database';
import { err } from '@/lib/utils';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  const userUUID = userId as UUID;

  switch (req.method) {
    case 'GET':
      return handleGetCart(res, userUUID);
    case 'POST':
      return handleUpdateCart(req, res, userUUID);
    case 'DELETE':
      return handleClearCart(res, userUUID);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCart(res: NextApiResponse, userId: UUID) {
  try {
    const cart = await sqlDatabase.orders.getActiveUserOrder(userId);
    return res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

async function handleUpdateCart(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: UUID,
) {
  const { action, shopId } = req.body;
  if (!shopId || !action) {
    return res.status(400).json({ error: 'Missing shopId or action' });
  }

  try {
    const maybeCart = await sqlDatabase.orders.getActiveUserOrder(userId);
    if (action === 'add') {
      const { orderItems } = req.body;
      const updatedCart = maybeCart
        ? await sqlDatabase.orders.update(maybeCart.id, [
            { __type: 'add', orderItem: orderItems },
          ])
        : await sqlDatabase.orders.save(shopId, userId, orderItems);
      return res.status(200).json(updatedCart);
    }
    if (action === 'delete') {
      if (!maybeCart) return res.status(500).json({ error: 'Cart not found' });

      const { orderItemId } = req.body;
      const updatedCart = await sqlDatabase.orders.update(maybeCart.id, [
        { __type: 'delete', orderItemId },
      ]);
      return res.status(200).json(updatedCart);
    }

    return err('Invalid action');
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Failed to add to cart' });
  }
}

async function handleClearCart(res: NextApiResponse, userId: UUID) {
  try {
    const maybeCart = await sqlDatabase.orders.getActiveUserOrder(userId);
    if (!maybeCart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const clearedCart = await sqlDatabase.orders.clear(maybeCart.id);
    return res.status(200).json(clearedCart);
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
}
