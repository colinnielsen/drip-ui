import { UUID } from '@/data-model/_common/type/CommonType';
import privy from '@/lib/privy';
import { generateUUID } from '@/lib/utils';
import { User as PrivyUser } from '@privy-io/server-auth';
import { v5, validate as validateUUID } from 'uuid';
import { PrivyDID } from '../_external/PrivyType';
import { User, UserId, WalletConnectorType } from './UserType';

// A valid UUID to be used as a namespace
const PRIVY_NAMESPACE = 'E34251C3-01F3-4788-8E93-CE0FBC50EA5D';

export const mapPrivyIdToUserId = (privyId: PrivyDID) => {
  if (!privyId || typeof privyId !== 'string' || !validateUUID(PRIVY_NAMESPACE))
    throw new Error('Invalid privyId');

  return v5(privyId, PRIVY_NAMESPACE) as UUID;
};

export const mapToUserId = (derivation?: string): User['id'] =>
  UserId(generateUUID(derivation));

export const mapToUser = ({
  wallet: wallet,
  authServiceId,
}: {
  wallet: NonNullable<User['wallet']>;
  authServiceId?: User['authServiceId'];
}): User => ({
  id: mapToUserId(authServiceId?.id),
  createdAt: new Date(),
  wallet,
});
/**
 * @throws if the user has no wallet
 */
// export const mapPrivyUserToNewUser = (privyUser: PrivyUser): Unsaved<User> => {
//   const privyDID = privyUser.id as PrivyDID;

//   const wallet = getWalletInfoFromPrivyUser(privyUser);

//   return {
//     __type: 'user',
//     role: 'user',
//     authServiceId: {
//       __type: 'privy',
//       id: privyDID,
//     },
//     wallet,
//     createdAt: privyUser.createdAt.toISOString(),
//   };
// };

/**
 *
 * @throws if privy user is not found
 */
export const mapUserToSavedUserViaPrivy = async (
  user: User,
  _privyInfo: PrivyUser | PrivyDID,
): Promise<User> => {
  const privyDid =
    typeof _privyInfo === 'string' ? _privyInfo : (_privyInfo.id as PrivyDID);

  const privyInfo = await privy.getUser({ idToken: privyDid });

  return {
    ...user,
    authServiceId: {
      __type: 'privy',
      id: privyInfo.id as PrivyDID,
    },
    wallet: getWalletInfoFromPrivyUser(privyInfo),
  };
};

//
//// UTILS
//
function getWalletInfoFromPrivyUser({ wallet }: PrivyUser) {
  if (!wallet) throw new Error('User has no wallet');
  if (!wallet.connectorType) throw new Error('Wallet has no connector type');

  return {
    __type: wallet.connectorType as WalletConnectorType,
    address: wallet.address as `0x${string}`,
  } satisfies User['wallet'];
}
