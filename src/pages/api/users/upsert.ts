import { PrivyDID } from '@/data-model/_external/privy';
import {
  mapPrivyIdToUserId,
  mapUserToSavedUserViaPrivy,
} from '@/data-model/user/UserDTO';
import { database } from '@/infras/database';
import privy from '@/lib/privy';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function upsertUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const privyToken = req.cookies['privy-token'];
  const sessionToken = req.cookies[SESSION_COOKIE_NAME] as UUID | undefined;

  if (!privyToken)
    return res.status(400).json({ error: 'privy-token not found in cookies' });
  if (!sessionToken)
    return res
      .status(400)
      .json({ error: 'session-token not found in cookies' });

  try {
    const verifiedClaims = await privy.verifyAuthToken(privyToken);
    const privyId = verifiedClaims.userId as PrivyDID;
    const userId = mapPrivyIdToUserId(privyId);

    const maybeUser = await database.users.findById(userId);
    if (maybeUser) return res.status(200).json(maybeUser);

    const sessionUser = await database.users.findById(sessionToken);
    if (!sessionUser)
      return res
        .status(404)
        .json({ error: 'session token is not associated with a user' });

    const privyUser = await privy.getUser(privyId).catch(e => {
      console.error(e);
      throw Error('privy-user not found: ' + e.message);
    });

    const unsavedUser = mapUserToSavedUserViaPrivy(sessionUser, privyUser);

    const newlySavedUser = await database.users.save(unsavedUser);

    return res.status(200).json(newlySavedUser);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: 'Failed to upsert user: ' + error.message });
  }
}
