import { revalidatePathIfExists, withErrorHandling } from '@/lib/next';
import { ONBOARDED_SHOPS } from '@/lib/static-data';
import ShopService from '@/services/ShopService';
import { SyncService } from '@/services/SyncService';
import { NextApiRequest, NextApiResponse } from 'next';

const syncService = new SyncService();

export default withErrorHandling(async function (
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const previousShopIds = await ShopService.findAll().then(shops =>
    shops.map(shop => shop.id),
  );

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
