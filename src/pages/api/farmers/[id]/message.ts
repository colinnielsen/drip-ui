import { sqlDatabase } from '@/infras/database';
import { getAndValidateUserRequest, withErrorHandling } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  //
  /// validate inputs
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id: farmerId } = req.query;
  const userId = getAndValidateUserRequest(req);
  const { message: messageParam } = req.body;
  if (typeof messageParam !== 'string')
    return res.status(400).json({ error: 'Invalid message' });

  if (!isUUID(farmerId))
    return res.status(400).json({ error: 'Invalid farmerId' });
  const farmer = await sqlDatabase.farmers.findById(farmerId);
  if (!farmer)
    return res
      .status(404)
      .json({ error: `Farmer with id ${farmerId} not found` });

  //
  /// upsert farmer message
  const message = await sqlDatabase.farmers.upsertFarmerMessage({
    amount: null,
    farmer: farmerId,
    sendingUser: userId,
    message: messageParam,
  });

  return res.status(200).json(message);
}, 'farmers/[id]/donate');
