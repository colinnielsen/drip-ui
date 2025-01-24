import { ApiRoute } from '@/lib/next';
import { withRedisCache } from '@/lib/redis';
import { sliceKit } from '@/lib/slice';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  await withRedisCache(sliceKit.getStoreProducts)({
    slicerId: req.body.slicerId,
    buyer: req.body.buyer,
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

export default ApiRoute(handler, 'get-store-products');
