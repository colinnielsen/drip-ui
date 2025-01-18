import { bootstrapSQLDB, resetSQLDB } from '@/infrastructures/sql-db';
import { getDBSecret } from '@/lib/constants';
import { revalidatePathIfExists, ApiRoute } from '@/lib/next';
import { ONBOARDED_SHOPS, STATIC_FARMER_DATA } from '@/lib/static-data';
import ShopService from '@/services/ShopService';
import { SyncService } from '@/services/SyncService';
import { NextApiRequest, NextApiResponse } from 'next';

const syncService = new SyncService();

export default ApiRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.query.secret !== getDBSecret())
    return res.status(304).json({
      message: 'invalid secret',
    });

  const previousShopIds = await ShopService.findAll().then(shops =>
    shops.map(shop => shop.id),
  );

  if (req.query.reset) await resetSQLDB();

  await bootstrapSQLDB();
  // save all shop configs
  await Promise.all(
    ONBOARDED_SHOPS.map(
      async config => await ShopService.saveShopConfig(config),
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
}, 'seed');
