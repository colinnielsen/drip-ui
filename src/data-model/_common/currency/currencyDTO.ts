import { CURRENCIES, Currency } from '../type/CommonType';
import { ETH } from './ETH';
import { USDC } from './USDC';

export const isCurrency = (c: unknown): c is Currency => {
  return c instanceof USDC || c instanceof ETH;
};

export const addCurrencies = <T extends Currency>(a: T, b: T): T => {
  if (a instanceof USDC && b instanceof USDC) {
    return a.add(b) as T;
  }
  if (a instanceof ETH && b instanceof ETH) {
    return a.add(b) as T;
  }

  throw new Error('Invalid currency type');
};

/**
 * @throws if the currency is not a valid currency
 */
export const rehydrateCurrency = (currency: any): Currency => {
  if (CURRENCIES.some(c => currency instanceof c)) return currency;

  if (currency.__dripType === 'USDC') return USDC.fromJSON(currency);
  if (currency.__dripType === 'ETH') return ETH.fromJSON(currency);

  throw new Error('Invalid currency type');
};
