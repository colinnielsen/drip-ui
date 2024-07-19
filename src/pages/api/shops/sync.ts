import { NextApiRequest, NextApiResponse } from 'next';
import { SyncService } from '@/services/SyncService';
import { JSONShopRepository } from '@/infras/repositories/ShopRepository';
import { JSONItemRepository } from '@/infras/repositories/ItemRepository';
import { ONBOARDED_SHOPS } from '@/lib/constants';

const shopRepository = new JSONShopRepository();
const itemRepository = new JSONItemRepository();
const syncService = new SyncService(shopRepository, itemRepository);

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  await syncService
    .syncStores(ONBOARDED_SHOPS)
    .then(() => {
      res.status(200).json({ message: 'Sync completed' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
}
