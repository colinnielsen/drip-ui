import { ETH } from './ETH';
import { USDC } from './USDC';

export type CurrencyCode = 'eth' | 'usdc';

export type Currency = InstanceType<typeof USDC | typeof ETH>;
