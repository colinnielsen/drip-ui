import { database } from '@/infras/database';
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
      return handleAddToCart(req, res, userUUID);
    case 'DELETE':
      return handleClearCart(res, userUUID);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCart(res: NextApiResponse, userId: UUID) {
  try {
    const cart = await database.orders.getActiveUserOrder(userId);
    return res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

async function handleAddToCart(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: UUID,
) {
  const { shopId, orderItems } = req.body;
  if (!shopId || !orderItems) {
    return res.status(400).json({ error: 'Missing shopId or orderItem' });
  }

  try {
    const maybeCart = await database.orders.getActiveUserOrder(userId);
    const updatedCart = maybeCart
      ? await database.orders.update(maybeCart.id, [
          { __type: 'add', item: orderItems },
        ])
      : await database.orders.save(shopId, userId, orderItems);

    return res.status(200).json(updatedCart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Failed to add to cart' });
  }
}

async function handleClearCart(res: NextApiResponse, userId: UUID) {
  try {
    const maybeCart = await database.orders.getActiveUserOrder(userId);
    if (!maybeCart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const clearedCart = await database.orders.clear(maybeCart.id);
    return res.status(200).json(clearedCart);
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
}
