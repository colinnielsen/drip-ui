import { PrivyClient } from '@privy-io/server-auth';
import { getPrivyAppId, getPrivySecret } from './constants';

export const PRIVY_TOKEN_NAME = 'privy-token';

const PC = new PrivyClient(getPrivyAppId(), getPrivySecret());

export default PC;
