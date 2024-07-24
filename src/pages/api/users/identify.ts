import { PrivyDID } from '@/data-model/_external/privy';
import { mapUserToSavedUserViaPrivy } from '@/data-model/user/UserDTO';
import { User } from '@/data-model/user/UserType';
import { sqlDatabase } from '@/infras/database';
import { withErrorHandling } from '@/lib/next';
import privy from '@/lib/privy';
import { retreiveOrGenerateSessionId } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @dev be aware that if the user is logged out of privy, they will _need to login directly
 * This is because the session token is the id of the user,
 */
export default withErrorHandling(async function identify(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const privyLoginToken = req.cookies['privy-token'];
  const sessionId = retreiveOrGenerateSessionId(req, res);

  // if they have never used the app or cleared their cookies
  //    and they have no privy login tokens in their browser
  if (!privyLoginToken)
    return await sqlDatabase.users
      // we create a new session user for them
      .getOrCreateSessionUser(sessionId)
      .then(u => res.status(200).json(u));

  // if there is a privy token
  const verifResponse = await privy
    .verifyAuthToken(privyLoginToken)
    .catch(() => {
      return null;
    });

  // make sure it verifies
  if (!verifResponse) return res.status(401).json({ error: 'Unauthorized' });
  const privyId = verifResponse.userId as PrivyDID;
  // try and find the user by their privy id
  const maybeUserFromPrivyId =
    await sqlDatabase.users.findByAuthServiceId(privyId);

  if (maybeUserFromPrivyId) return res.status(200).json(maybeUserFromPrivyId);
  else
    return await sqlDatabase.users
      // otherwise, create a new session user for them
      .getOrCreateSessionUser(sessionId)
      // then map the user to a saved user via privy
      .then(u => mapUserToSavedUserViaPrivy(u, privyId))
      // then save the user
      .then(u => sqlDatabase.users.save(u))
      // then return the user
      .then(u => res.status(200).json(u));
}, 'Failed to identify user');
