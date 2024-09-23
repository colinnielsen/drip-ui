import { isCurrency } from '@/data-model/_common/currency/currencyDTO';
import { Currency } from '@/data-model/_common/type/CommonType';
import { withErrorHandling } from '@/lib/next';
import { rehydrateData } from '@/lib/utils';
import OrderService from '@/services/OrderService';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { Hex, isHex } from 'viem';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  req.body = rehydrateData(req.body);
  const orderId = req.body.orderId as UUID;
  const transactionHash = req.body.transactionHash as Hex;
  const paidPrices = req.body.paidPrices as Record<UUID, Currency>;

  if (
    typeof transactionHash !== 'string' ||
    !isHex(transactionHash) ||
    !paidPrices ||
    !Object.values(paidPrices).every(isCurrency) ||
    req.method !== 'POST'
  )
    return res.status(400).json({ error: 'Bad request' });

  await OrderService.pay(orderId, transactionHash, paidPrices)
    .then(order => res.status(200).json(order))
    .catch(error =>
      res
        .status(500)
        .json({ error: 'Internal server error: ' + error.message }),
    );
}, 'orders/pay');
