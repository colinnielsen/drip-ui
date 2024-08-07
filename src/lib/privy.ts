import { PrivyClient } from '@privy-io/server-auth';
import { getPrivyAppId, getPrivySecret } from './constants';

const PC = new PrivyClient(getPrivyAppId(), getPrivySecret());

export default PC;
