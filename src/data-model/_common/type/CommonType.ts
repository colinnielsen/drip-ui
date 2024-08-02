import { ETH } from '../currency/ETH';
import { USDC } from '../currency/USDC';

declare const __value_type__: unique symbol;
export type ValueType<BaseType, TypeName> = BaseType & {
  readonly [__value_type__]: TypeName;
};

export type Unsaved<T> = Omit<T, 'id'>;

export type SupportedCurrency = 'eth' | 'usdc';

export type Currency = USDC | ETH;
