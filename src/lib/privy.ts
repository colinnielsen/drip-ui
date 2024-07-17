import { PrivyClient } from '@privy-io/server-auth';
import { getPrivyAppId, getPrivySecret } from './constants';

export default new PrivyClient(getPrivyAppId(), getPrivySecret());
