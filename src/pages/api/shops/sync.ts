import { NextApiRequest, NextApiResponse } from 'next';
import { SyncService } from '@/services/SyncService';
import { ONBOARDED_SHOPS } from '@/lib/constants';
import { database } from '@/infras/database';

const syncService = new SyncService(database.shops, database.items);

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
