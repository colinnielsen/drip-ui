import { sqlDatabase } from '@/infras/database';
import { withErrorHandling } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (!isUUID(id)) return res.status(400).json({ error: 'Invalid farmerId' });

  const messages = await sqlDatabase.farmers.getFarmerMessages(
    id,
    req.query.limit ? parseInt(req.query.limit as string) : undefined,
  );

  return res.status(200).json(messages);
}, 'farmers/[id]/messages');
