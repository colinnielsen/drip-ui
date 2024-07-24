import { sqlDatabase } from '@/infras/database';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { Hex, isHex } from 'viem';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const orderId = req.body.orderId as UUID;
  const transactionHash = req.body.transactionHash as Hex;

  if (
    typeof transactionHash !== 'string' ||
    !isHex(transactionHash) ||
    !orderId ||
    req.method !== 'POST'
  )
    return res.status(400).json({ error: 'Bad request' });

  await sqlDatabase.orders
    .pay(orderId, transactionHash)
    .then(order => {
      res.status(200).json(order);
    })
    .catch(error => {
      res
        .status(500)
        .json({ error: 'Internal server error: ' + error.message });
    });
}
