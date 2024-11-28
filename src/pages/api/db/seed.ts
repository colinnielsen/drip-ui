import { bootstrapSQLDB, resetSQLDB } from '@/infrastructures/sql-db';
import { revalidatePathIfExists, withErrorHandling } from '@/lib/next';
import { ONBOARDED_SHOPS, STATIC_FARMER_DATA } from '@/lib/static-data';
import ShopService from '@/services/ShopService';
import { SyncService } from '@/services/SyncService';
import { NextApiRequest, NextApiResponse } from 'next';

const syncService = new SyncService();

export default withErrorHandling(
  async (_req: NextApiRequest, res: NextApiResponse) => {
    const previousShopIds = await ShopService.findAll().then(shops =>
      shops.map(shop => shop.id),
    );

    if (_req.query.reset) await resetSQLDB();

    await bootstrapSQLDB();
    // save all store configs
    await Promise.all(
      ONBOARDED_SHOPS.map(
        async storeConfig => await ShopService.saveStoreConfig(storeConfig),
      ),
    );
    await Promise.all([
      // sync all stores
      syncService.syncStores(),
      // sync all farmers
      syncService.syncFarmers(STATIC_FARMER_DATA),
    ]);

    await res.revalidate('/');

    await Promise.all(
      previousShopIds.map(id => revalidatePathIfExists(res, `/shops/${id}`)),
    );

    await Promise.all(
      STATIC_FARMER_DATA.map(farmer =>
        revalidatePathIfExists(res, `/farmers/${farmer.id}`),
      ),
    );

    return res.status(200).json({ message: 'Seeding complete' });
  },
  'seed',
);
