import { UnimplementedPathError } from '@/lib/effect';
import { ETH } from '../currency/ETH';
import { USDC } from '../currency/USDC';

export const rehydrateDripType = (o: {
  __dripType: string;
  [string: string]: unknown;
}) => {
  for (const instance of [USDC, ETH]) {
    if (instance.ZERO.__currencyType === o.__dripType)
      return instance.fromJSON(o);
  }
  throw new UnimplementedPathError(`drip type not found: ${o.__dripType}`);
};
