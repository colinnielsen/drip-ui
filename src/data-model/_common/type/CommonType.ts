import { UUID as UUID_Crypto } from 'node:crypto';

declare const __value_type__: unique symbol;
export type ValueType<BaseType, TypeName> = BaseType & {
  readonly [__value_type__]: TypeName;
};

export type Unsaved<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P] | null;
};

export type UUID = UUID_Crypto;

const ISODateStringBrand = Symbol('ISO_DATE_STRING');

export type ISODateString = string & {
  __brand: typeof ISODateStringBrand;
};

export type AllExist<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>;
};
