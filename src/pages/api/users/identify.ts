import { PrivyDID } from '@/data-model/_external/privy';
import { mapPrivyIdToUserId } from '@/data-model/user/UserDTO';
import { database } from '@/infras/database';
import privy from '@/lib/privy';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = req.cookies['privy-token'];

  if (!accessToken)
    return res.status(302).json({ error: 'privy-token not found in cookies' });

  try {
    const verifiedClaims = await privy.verifyAuthToken(accessToken);
    const privyId = verifiedClaims.userId as PrivyDID;
    const userId = mapPrivyIdToUserId(privyId);

    const user = await database.users.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(user);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: 'Failed to identify user: ' + error.message });
  }
}
