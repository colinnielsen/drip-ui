import { parseUnits, USDC_ADDRESS_BASE } from '@/lib/ethereum';
import { prettyFormatPrice } from '@/lib/utils';
import { Address } from 'viem';
import { Currency } from '../type/CommonType';

export const isUSDC = (value: unknown): value is USDC => {
  return value instanceof USDC;
};

/**
 * the USDC value in Wei
 * @example 1 USDC = 10^6 Wei
 */
export class USDC {
  public __currencyType: 'USDC' = 'USDC';
  public wei: bigint;

  public static readonly address: Address = USDC_ADDRESS_BASE;
  public readonly address: Address = USDC.address;
  public static readonly decimals: number = 6;
  public readonly decimals: number = USDC.decimals;
  public static readonly UNIT: bigint = BigInt(10 ** USDC.decimals);
  public readonly UNIT: bigint = BigInt(10 ** USDC.decimals);
  public static readonly ZERO: USDC = new USDC(0);
  public static readonly ONE: USDC = new USDC(1);
  public static readonly BPS_BASE: bigint = BigInt(1000);

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.wei); // 1000000
   * (usdc.prettyFormat()); // $1.00
   */
  constructor(amountUSD: bigint | number | string | USDC | undefined | null) {
    if (typeof amountUSD === 'number' && amountUSD > Number.MAX_SAFE_INTEGER)
      throw new Error('Amount too large');

    if (amountUSD instanceof USDC) {
      this.wei = amountUSD.wei;
      return;
    }

    if (
      amountUSD === '' ||
      amountUSD === '0' ||
      amountUSD === 0 ||
      amountUSD === undefined ||
      amountUSD === null
    ) {
      this.wei = 0n;
      return;
    }

    const normalizedInput =
      typeof amountUSD === 'number'
        ? amountUSD.toLocaleString('fullwide', { useGrouping: false })
        : amountUSD.toString();

    this.wei = parseUnits(normalizedInput, USDC.decimals);
  }

  /**
   * @example
   * const usdc = USDC.fromUSD(1);
   * (usdc.wei); // 1000000
   * (usdc.prettyFormat()); // $1.00
   */
  static fromUSD(amountUSD: bigint | number | string | USDC): USDC {
    return new USDC(amountUSD);
  }

  /**
   * @example
   * const usdc = USDC.fromWei(1000000);
   * (usdc.wei); // 1000000
   * (usdc.prettyFormat()); // $1.00
   */
  static fromWei(weiAmount: bigint | number | string): USDC {
    const as_num = Number(weiAmount);
    if (isNaN(as_num)) throw new Error('Invalid amount');
    if (as_num > Number.MAX_SAFE_INTEGER) throw new Error('Amount too large');

    const usdc = new USDC(0);
    const truncated = Math.floor(as_num);
    usdc.wei = BigInt(truncated);

    return usdc;
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * const usdc2 = usdc.mul(2);
   * (usdc2.wei); // 2000000
   * (usdc2.prettyFormat()); // $2.00
   */
  mul(amountUSD: bigint | number | string | USDC): USDC {
    const multiplier = USDC.fromUSD(amountUSD);
    const weiResult = (this.wei * multiplier.wei) / USDC.UNIT;

    return USDC.fromWei(weiResult);
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * const usdc2 = usdc.add(2);
   * (usdc2.wei); // 3000000
   * (usdc2.prettyFormat()); // $3.00
   */
  add(amountUSD: bigint | number | string | USDC): USDC {
    const addend = USDC.fromUSD(amountUSD);
    const weiResult = this.wei + addend.wei;

    return USDC.fromWei(weiResult);
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * const usdc2 = usdc.sub(2);
   * (usdc2.wei); // -1000000
   * (usdc2.prettyFormat()); // -$1.00
   */
  sub(amountUSD: bigint | number | string | USDC): USDC {
    const subtrahend = USDC.fromUSD(amountUSD);
    const weiResult = this.wei - subtrahend.wei;
    return USDC.fromWei(weiResult);
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * const usdc2 = usdc.div(2);
   * (usdc2.wei); // 500000
   * (usdc2.prettyFormat()); // $0.50
   */
  div(amount: bigint | number | string | USDC): USDC {
    const divisor =
      amount instanceof USDC ? amount.wei : BigInt(amount) * USDC.UNIT;
    return USDC.fromWei((this.wei * USDC.UNIT) / divisor);
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.toUSD()); // 1
   */
  toUSD(): number {
    return Number(this.wei) / Number(USDC.UNIT);
  }

  toCents(): bigint {
    return (this.wei * 100n) / USDC.UNIT;
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.prettyFormat()); // $1.00
   */
  prettyFormat(): string {
    return prettyFormatPrice(this.toWeiString(), USDC.decimals, true);
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.toWei()); // 1000000
   */
  toWei(): bigint {
    return this.wei;
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.toWeiString()); // 1000000
   */
  toWeiString(): string {
    return this.toWei().toString();
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (usdc.toWeiNumber()); // 1000000
   */
  toWeiNumber(): number {
    return Number(this.toWei());
  }

  /**
   * @example
   * const usdc = new USDC(1);
   * (JSON.stringify(usdc));
   * // Output: {"__dripType":"USDC","wei":"1000000"}
   */
  toJSON() {
    return {
      __dripType: 'USDC',
      wei: this.toWeiString(),
    };
  }

  static fromJSON(json: any): USDC {
    if (json.__dripType !== 'USDC') throw new Error('Invalid JSON for USDC');

    return USDC.fromWei(json.wei);
  }

  percentageOf({ percent }: { percent: number }): USDC {
    if ((percent && percent < 0.0001) || percent > 100)
      throw new Error('Percentage must be between 1 BPS and 100%');

    return this.mul(percent).div(100);
  }

  /**
   * @example
   * const usdc1 = new USDC(1);
   * const usdc2 = new USDC(1);
   * (usdc1.eq(usdc2)); // true
   */
  eq(other: Currency): other is USDC {
    if (!(other instanceof USDC)) return false;

    return this.wei === other.wei;
  }

  /**
   * @example
   * const usdc1 = new USDC(1);
   * const usdc2 = new USDC(2);
   * (usdc1.gt(usdc2)); // false
   */
  gt(other: USDC): boolean {
    return this.wei > other.wei;
  }

  gte(other: USDC): boolean {
    return this.wei >= other.wei;
  }

  /**
   * @example
   * const usdc1 = new USDC(1);
   * const usdc2 = new USDC(2);
   * (usdc1.lt(usdc2)); // true
   */
  lt(other: USDC): boolean {
    return this.wei < other.wei;
  }

  lte(other: USDC): boolean {
    return this.wei <= other.wei;
  }

  is(other: Currency): other is USDC {
    return this.__currencyType === other.__currencyType;
  }
}

// const USDC_BRAND = Symbol('USDC');

// /**
//  * @dev the wei representation of usdc
//  *
//  */
// export type USDC = ValueType<string, typeof USDC_BRAND>;

// export const oneUSDC = '1000000' as USDC;

// /**
//  * @param usdc - the amount of usdc to convert to wei
//  * @returns the wei representation of the usdc
//  * @example
//  * toUSDC(1) === '1000000'
//  * toUSDC(1.5) === '1500000'
//  * toUSDC(0.000001) === '1'
//  */
// export const toUSDC = (usdc: string | number | bigint): USDC => {
//   const int = Number(usdc.toString());
//   const amount = int * 1_000_000;
//   const result = +amount.toFixed(6);

//   return result.toString().replace('.', '') as USDC;
// };

// export const toWei = (usdc: USDC): string => {
//   return usdc.toString();
// };

// export const toBigInt = (usdc: USDC): bigint => {
//   return BigInt(usdc);
// };

// export const mul = (usdc: USDC, amount: number | string | number): USDC => {
//   const multiplier = toUSDC(amount).toString();
//   const result = (toBigInt(usdc) * BigInt(multiplier)) / toBigInt(oneUSDC);

//   return result.toString() as USDC;
// };

// export const add = (usdc: USDC, amount: number | string | number): USDC => {
//   const result = toBigInt(usdc) + toBigInt(toUSDC(amount));

//   return result.toString() as USDC;
// };

// export const format = (usdc: USDC): string => {
//   return prettyFormatPrice(usdc, 6, true);
// };
