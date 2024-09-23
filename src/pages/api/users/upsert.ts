import { PrivyDID } from '@/data-model/_external/privy';
import { mapUserToSavedUserViaPrivy } from '@/data-model/user/UserDTO';
import { SavedUser } from '@/data-model/user/UserType';
import { withErrorHandling } from '@/lib/next';
import privy from '@/lib/privy';
import { PRIVY_TOKEN_NAME, SESSION_COOKIE_NAME } from '@/lib/session';
import OrderService from '@/services/OrderService';
import UserService from '@/services/UserService';
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

  // case 1: the user existed on another device and signed with the same wallet, this will yield the same user
  const maybeUser = await UserService.findByAuthServiceId(privyId);
  if (
    maybeUser &&
    maybeUser.__type === 'user' &&
    maybeUser.authServiceId?.id === privyId
  ) {
    const user = maybeUser as SavedUser;
    // if the session token does not match the user's session token
    // this means they are now on a new device
    if (user.id !== sessionToken) {
      // we need to:
      // 1. then migrate their old orders to their new account
      await OrderService.migrate({
        prevUserId: user.id,
        newUserId: sessionToken,
      });
      // 2. migrate their old account to their new one (pull old data to new)
      const migratedUser = await UserService.migrate({
        prevId: user.id,
        newId: sessionToken,
      });
      if (migratedUser.id !== sessionToken) {
        debugger;
      }
      return res.status(200).json(migratedUser);
    }
    return res.status(200).json(maybeUser);
  }

  // case 2: the user is just a session user, and we load their session user, and convert it to a saved user with the privy user data
  const sessionUser = await UserService.findById(sessionToken);
  if (!sessionUser)
    return res
      .status(404)
      .json({ error: 'session token is not associated with a user' });

  const privyUser = await privy.getUser(privyId).catch(e => {
    console.error(e);
    throw Error('privy-user not found: ' + e.message);
  });

  return await mapUserToSavedUserViaPrivy(sessionUser, privyUser)
    .then(u => UserService.save(u))
    .then(savedUser => res.status(200).json(savedUser));
}, 'upsert user');
