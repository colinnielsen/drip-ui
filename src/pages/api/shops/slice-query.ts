import { NextApiRequest, NextApiResponse } from 'next';
import slicekit from '@/lib/slicekit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const shopId = req.query.shopId as string;
  const [store] = await slicekit.getStores({ slicerIds: [+shopId] });
  if (!store) return res.status(404).json({ message: 'Store not found' });

  const products = await slicekit.getStoreProducts({ slicerId: +shopId });
  return res.status(200).json({ store, products });
}
