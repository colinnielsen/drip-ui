import { PrivyDID } from '@/data-model/_external/privy';
import { mapUserToSavedUserViaPrivy } from '@/data-model/user/UserDTO';
import { sqlDatabase } from '@/infras/database';
import { withErrorHandling } from '@/lib/next';
import privy from '@/lib/privy';
import { PRIVY_TOKEN_NAME, SESSION_COOKIE_NAME } from '@/lib/session';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export default withErrorHandling(async function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const privyToken = req.cookies[PRIVY_TOKEN_NAME];
  const sessionToken = req.cookies[SESSION_COOKIE_NAME] as UUID | undefined;

  if (!privyToken)
    return res.status(400).json({ error: 'privy-token not found in cookies' });
  if (!sessionToken)
    return res
      .status(400)
      .json({ error: 'session-token not found in cookies' });

  const verifiedClaims = await privy.verifyAuthToken(privyToken);
  const privyId = verifiedClaims.userId as PrivyDID;

  // maybe the normal user exists, and we can try and find them by their signed privy id
  const maybeUser = await sqlDatabase.users.findByAuthServiceId(privyId);
  // if so, and they're already created, return it
  if (
    maybeUser &&
    maybeUser.__type === 'user' &&
    maybeUser.authServiceId?.id === privyId
  )
    return res.status(200).json(maybeUser);

  // otherwise find the session user by session token
  const sessionUser = await sqlDatabase.users.findById(sessionToken);
  if (!sessionUser)
    return res
      .status(404)
      .json({ error: 'session token is not associated with a user' });

  const privyUser = await privy.getUser(privyId).catch(e => {
    console.error(e);
    throw Error('privy-user not found: ' + e.message);
  });

  return await mapUserToSavedUserViaPrivy(sessionUser, privyUser)
    .then(u => sqlDatabase.users.save(u))
    .then(savedUser => res.status(200).json(savedUser));
}, 'Failed to upsert user');
