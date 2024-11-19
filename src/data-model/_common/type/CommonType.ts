import { ETH } from '../currency/ETH';
import { USDC } from '../currency/USDC';

declare const __value_type__: unique symbol;
export type ValueType<BaseType, TypeName> = BaseType & {
  readonly [__value_type__]: TypeName;
};

export type Unsaved<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P] | null;
};

export type SupportedCurrency = 'eth' | 'usdc';

export const CURRENCIES = [ETH, USDC] as const;

export type Currency = InstanceType<(typeof CURRENCIES)[number]>;
