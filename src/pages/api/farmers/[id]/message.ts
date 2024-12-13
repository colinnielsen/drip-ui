import { getAndValidateUserRequest, ApiRoute } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import FarmerService from '@/services/FarmerService';
import { NextApiRequest, NextApiResponse } from 'next';

export default ApiRoute(async function (
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
  const farmer = await FarmerService.findById(farmerId);
  if (!farmer)
    return res
      .status(404)
      .json({ error: `Farmer with id ${farmerId} not found` });

  //
  /// upsert farmer message
  const message = await FarmerService.upsertFarmerMessage({
    amount: null,
    farmer: farmerId,
    sendingUser: userId,
    message: messageParam,
  });

  return res.status(200).json(message);
}, 'farmers/[id]/donate');
