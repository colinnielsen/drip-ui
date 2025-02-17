import { ApiRoute } from '@/lib/next';
import { isUUID } from '@/lib/utils';
import { authenticationService } from '@/services/AuthenticationService';
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

  const user = await authenticationService.checkAuthentication_sync(req, res);
  if (!user) return res.status(401).json({ error: 'Not authorized' });

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
    sendingUser: user.id,
    message: messageParam,
  });

  return res.status(200).json(message);
}, 'farmers/[id]/donate');
