import { PrivyDID } from '@/data-model/_external/privy';
import { mapUserToSavedUserViaPrivy } from '@/data-model/user/UserDTO';
import { User } from '@/data-model/user/UserType';
import { withErrorHandling } from '@/lib/next';
import privy from '@/lib/privy';
import { SESSION_COOKIE_NAME, setSessionId } from '@/lib/session';
import { generateUUID, isUUID } from '@/lib/utils';
import UserService from '@/services/UserService';
import { UUID } from 'crypto';
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
  const incomingSessionId = req.cookies[SESSION_COOKIE_NAME] as
    | UUID
    | 'null'
    | undefined;

  // if there is a privy token
  if (privyLoginToken) {
    const verifResponse = await privy
      .verifyAuthToken(privyLoginToken)
      .catch(() => {
        return null;
      });
    // make sure it verifies
    if (!verifResponse)
      return res.status(401).json({ error: 'External Auth failed' });

    const privyId = verifResponse.userId as PrivyDID;

    // try and find the user by their privy id
    const maybeUserFromPrivyId = await UserService.findByAuthServiceId(privyId);

    // if the user exists, return the user
    if (maybeUserFromPrivyId) {
      // if the session id is not the same as the user's id, set the session id
      if (
        !isUUID(incomingSessionId) ||
        maybeUserFromPrivyId.id !== incomingSessionId
      )
        setSessionId(maybeUserFromPrivyId.id, res);

      return res.status(200).json(maybeUserFromPrivyId);
    } else {
      const newUserId = generateUUID();
      if (!isUUID(incomingSessionId)) setSessionId(newUserId, res);
      // otherwise, create a new session user for them
      return await UserService
        // otherwise, create a new session user for them
        .getOrCreateSessionUser(newUserId)
        // then map the user to a saved user via privy
        .then(u => mapUserToSavedUserViaPrivy(u, privyId))
        // then save the user
        .then(u => UserService.save(u))
        // then return the user
        .then(u => res.status(200).json(u));
    }
  }
  // otherwise, if they have no privy login token, create a new session user
  else {
    const sessionId = !isUUID(incomingSessionId)
      ? generateUUID()
      : incomingSessionId;

    setSessionId(sessionId, res);

    return await UserService
      // we create a new session user for them
      .getOrCreateSessionUser(sessionId)
      .then(u => res.status(200).json(u));
  }
}, 'identify user');
