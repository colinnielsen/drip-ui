import { StoreConfig } from '@/data-model/shop/ShopType';
import { revalidatePathIfExists, withErrorHandling } from '@/lib/next';
import ShopService from '@/services/ShopService';
import { SyncService } from '@/services/SyncService';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

const syncService = new SyncService();

async function syncAllStores(res: NextApiResponse) {
  const previousShopIds: UUID[] = await ShopService.findAll().then(shops =>
    shops.map(shop => shop.id),
  );

  await syncService
    .syncStores()
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
}

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const externalId = req.body.externalId as
    | StoreConfig['externalId']
    | undefined;

  // if no external id is provided, sync all stores
  if (!externalId) return await syncAllStores(res);
  // otherwise, sync the store with the given external id
  else
    await syncService
      .syncStore(externalId)
      .then(async shopId => {
        return res.status(200).json({ shopId });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.message });
      });
}, 'shops/sync');
