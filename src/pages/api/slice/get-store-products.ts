import { WAGMI_CONFIG } from '@/lib/ethereum';
import { withErrorHandling } from '@/lib/next';
import { sliceKit } from '@/lib/slice';
import { getStoreProducts } from '@slicekit/core';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  await sliceKit
    .getStoreProducts({
      ...req.body,
      chainId: 8453,
      dynamicPricing: true,
    })
    .then(r => res.status(200).json(r))
    .catch(error => {
      console.log('error', error.message);
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    });
};

export default withErrorHandling(handler, 'get-store-products');
