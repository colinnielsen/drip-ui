import { v5, validate as validateUUID } from 'uuid';
import { PrivyDID } from '../_external/privy';
import { UUID } from 'crypto';

// A valid UUID to be used as a namespace
const PRIVY_NAMESPACE = 'E34251C3-01F3-4788-8E93-CE0FBC50EA5D';

export const mapPrivyIdToUserId = (privyId: PrivyDID) => {
  if (!privyId || typeof privyId !== 'string' || !validateUUID(PRIVY_NAMESPACE))
    throw new Error('Invalid privyId');

  return v5(privyId, PRIVY_NAMESPACE) as UUID;
};
