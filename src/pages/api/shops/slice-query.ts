import { NextApiRequest, NextApiResponse } from 'next';
import { sliceKit } from '@/lib/slice';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const shopId = req.query.shopId as string;
  const [store] = await sliceKit.getStores({ slicerIds: [+shopId] });
  if (!store) return res.status(404).json({ message: 'Store not found' });

  const products = await sliceKit.getStoreProducts({ slicerId: +shopId });
  return res.status(200).json({ store, products });
}
