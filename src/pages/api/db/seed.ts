import { database } from '@/infras/database';
import { ONBOARDED_SHOPS, STATIC_FARMER_DATA } from '@/lib/constants';
import { SyncService } from '@/services/SyncService';
import { NextApiRequest, NextApiResponse } from 'next';

const syncService = new SyncService(database);

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  console.debug('seeding database...');
  await Promise.all([
    syncService.syncStores(ONBOARDED_SHOPS),
    syncService.syncFarmers(STATIC_FARMER_DATA),
  ])
    .then(() => {
      res.status(200).json({ message: 'Seeding complete' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
}
