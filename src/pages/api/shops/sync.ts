import { NextApiRequest, NextApiResponse } from 'next';
import { SyncService } from '@/services/SyncService';
import { ONBOARDED_SHOPS } from '@/lib/static-data';
import { sqlDatabase } from '@/infras/database';

const syncService = new SyncService(sqlDatabase);

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
