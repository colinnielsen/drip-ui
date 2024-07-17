import { PrivyDID } from '@/data-model/_external/privy';
import { User } from '@/data-model/user/UserType';
import { database } from '@/infras/database';
import privy from '@/lib/privy';
import { getSessionId } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @dev be aware that if the user is logged out of privy, they will _need to login directly
 * This is because the session token is the id of the user,
 */
export default async function identify(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const privyLoginToken = req.cookies['privy-token'];
  const sessionId = getSessionId(req, res);

  // if they have never used the app or cleared their cookies
  if (!privyLoginToken && !sessionId) {
    const sessionUser = await database.users.getOrCreateSessionUser(sessionId);
    return res.status(200).json(sessionUser);
  }

  // privy is the first class citizen
  if (privyLoginToken) {
    const verifResponse = await privy
      .verifyAuthToken(privyLoginToken)
      .catch(() => {
        return null;
      });

    if (!verifResponse) return res.status(401).json({ error: 'Unauthorized' });

    const user = await database.users.findByPrivyId(
      verifResponse.userId as PrivyDID,
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(user);
  }

  // then we try and find by the user id
  const user = await database.users.findById(sessionId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json(user);
}
