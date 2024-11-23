import { withErrorHandling } from '@/lib/next';
import { getSessionId } from '@/lib/session';
import { SquareService } from '@/services/SquareService';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const userId = getSessionId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const connection = await SquareService.findByUserId(userId);
  if (!connection)
    return res.status(404).json({ error: 'Connection not found' });

  return res.status(200).json(connection);
}, 'square-connection');
