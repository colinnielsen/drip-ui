import { NextApiRequest, NextApiResponse } from 'next';
import { SyncService } from '@/services/SyncService';
import { ONBOARDED_SHOPS } from '@/lib/static-data';
import { sqlDatabase } from '@/infras/database';
import { revalidatePathIfExists, withErrorHandling } from '@/lib/next';

const syncService = new SyncService(sqlDatabase);

export default withErrorHandling(async function (
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const previousShopIds = await sqlDatabase.shops
    .findAll()
    .then(shops => shops.map(shop => shop.id));

  await syncService
    .syncStores(ONBOARDED_SHOPS)
    .then(async () => {
      await res.revalidate('/');
      await Promise.all(
        previousShopIds.map(id => revalidatePathIfExists(res, `/shops/${id}`)),
      );
      return res.status(200).json({ message: 'Sync completed' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.message });
    });
}, 'shops/sync');
