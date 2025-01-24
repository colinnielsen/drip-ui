import { prettyFormatPrice } from '@/lib/utils';
import { formatEther, parseUnits } from 'viem';
import { USDC } from './USDC';

type InputType = bigint | number | string | ETH;
/**
 * the ETH value in Wei
 * @example 1 ETH = 10^18 Wei
 */
export class ETH {
  public __currencyType: 'ETH' = 'ETH';
  public wei: bigint;

  public static readonly decimals: number = 18;
  public readonly decimals: number = ETH.decimals;
  public static readonly UNIT: bigint = BigInt(10 ** ETH.decimals);
  public readonly UNIT: bigint = ETH.UNIT;
  public static readonly ZERO: ETH = new ETH(0);
  public static readonly ONE: ETH = new ETH(1);
  public static readonly BPS_BASE: bigint = BigInt(1000);

  /**
   * @example
   * const eth = new ETH(1);
   * (eth.wei); // 1000000000000000000
   * (eth.prettyFormat()); // 1.00
   */
  constructor(amountETH: bigint | number | string | ETH | undefined | null) {
    if (typeof amountETH === 'number' && amountETH > Number.MAX_SAFE_INTEGER)
      throw new Error('Amount too large');

    if (amountETH instanceof ETH) {
      this.wei = amountETH.wei;
      return;
    }

    if (
      amountETH === '' ||
      amountETH === '0' ||
      amountETH === 0 ||
      amountETH === undefined ||
      amountETH === null
    ) {
      this.wei = 0n;
      return;
    }

    this.wei = parseUnits(amountETH.toString(), ETH.decimals);
  }

  /**
   * @example
   * const eth = ETH.fromUSD(1);
   * (eth.wei); // 1000000000000000000
   * (eth.prettyFormat()); // 1.00
   */
  static fromEther(amountETH: bigint | number | string | ETH): ETH {
    return new ETH(amountETH);
  }

  /**
   * @example
   * const eth = ETH.fromWei(1000000);
   * (eth.wei); // 1000000
   * (eth.prettyFormat()); // 1.00
   */
  static fromWei(weiAmount: bigint | number | string): ETH {
    const as_num = Number(weiAmount);
    if (isNaN(as_num)) throw new Error('Invalid amount');
    if (as_num > Number.MAX_SAFE_INTEGER / Number(ETH.UNIT))
      throw new Error('Amount too large');

    const eth = new ETH(0);
    const truncated = Math.floor(as_num);
    eth.wei = BigInt(truncated);

    return eth;
  }

  /**
   * @example
   * const eth = new ETH(1);
   * const eth2 = eth.mul(2);
   * (eth2.wei); // 2000000000000000000
   * (eth2.prettyFormat()); // 2.00
   */
  mul(amountETH: bigint | number | string | ETH): ETH {
    const multiplier = ETH.fromEther(amountETH);
    const weiResult = (this.wei * multiplier.wei) / ETH.UNIT;

    return ETH.fromWei(weiResult);
  }

  /**
   * @example
   * const eth = new ETH(1);
   * const eth2 = eth.add(2);
   * (eth2.wei); // 3000000000000000000
   * (eth2.prettyFormat()); // 3.00
   */
  add(amountETH: bigint | number | string | ETH): ETH {
    const addend = ETH.fromEther(amountETH);
    const weiResult = this.wei + addend.wei;

    return ETH.fromWei(weiResult);
  }

  /**
   * @example
   * const eth = new ETH(1);
   * const eth2 = eth.sub(2);
   * (eth2.wei); // -1000000000000000000
   * (eth2.prettyFormat()); // -1.00
   */
  sub(amountETH: bigint | number | string | ETH): ETH {
    const subtrahend = ETH.fromEther(amountETH);
    const weiResult = this.wei - subtrahend.wei;
    return ETH.fromWei(weiResult);
  }

  /**
   * @example
   * const eth = new ETH(1);
   * const eth2 = eth.div(2);
   * (eth2.wei); // 5000000000000000000
   * (eth2.prettyFormat()); // 0.50
   */
  div(amount: bigint | number | string | ETH): ETH {
    const divisor =
      amount instanceof ETH ? amount.wei : BigInt(amount) * ETH.UNIT;
    return ETH.fromWei((this.wei * ETH.UNIT) / divisor);
  }

  /**
   * @dev TODO!
   * @example
   * 1 eth == 3000 usdc
   * toUSDC(1) == USDC(3000)
   */
  toUSDC(): USDC {
    const cost = 3000;
    const usdc = new USDC(cost);

    return usdc.mul(this.toEther());
  }

  toEther(): string {
    return formatEther(this.wei);
  }

  /**
   * @example
   * const eth = new ETH(1);
   * (eth.prettyFormat()); // 1.00
   */
  prettyFormat(): string {
    return prettyFormatPrice(this.toWeiString(), ETH.decimals, false);
  }

  /**
   * @example
   * const eth = new ETH(1);
   * (eth.toWei()); // 1000000000000000000
   */
  toWei(): bigint {
    return this.wei;
  }

  /**
   * @example
   * const eth = new ETH(1);
   * (eth.toWeiString()); // 1000000000000000000
   */
  toWeiString(): string {
    return this.toWei().toString();
  }

  /**
   * @example
   * const eth = new ETH(1);
   * (eth.toWeiNumber()); // 1000000000000000000
   */
  toWeiNumber(): number {
    return Number(this.toWei());
  }

  /**
   * @example
   * const eth = new ETH(1);
   * (JSON.stringify(eth));
   * // Output: {"__dripType":"ETH","wei":"1000000000000000000"}
   */
  toJSON() {
    return {
      __dripType: 'ETH',
      wei: this.toWeiString(),
    };
  }

  static fromJSON(json: any): ETH {
    if (json.__dripType !== 'ETH') throw new Error('Invalid JSON for ETH');

    return ETH.fromWei(json.wei);
  }

  percentageOf({ percent }: { percent: number }): ETH {
    if ((percent && percent < 0.0001) || percent > 100)
      throw new Error('Percentage must be between 1 BPS and 100%');

    return this.mul(percent).div(100);
  }

  /**
   * @example
   * const eth1 = new ETH(1);
   * const eth2 = new ETH(1);
   * (eth1.eq(eth2)); // true
   */
  eq(other: any): boolean {
    if (!this.is(other)) return false;

    return this.wei === other.wei;
  }

  /**
   * @example
   * const eth1 = new ETH(1);
   * const eth2 = new ETH(2);
   * (eth1.gt(eth2)); // false
   */
  gt(_other: InputType): boolean {
    const other = new ETH(_other);

    return this.wei > other.wei;
  }

  gte(_other: InputType): boolean {
    const other = new ETH(_other);

    return this.wei >= other.wei;
  }

  /**
   * @example
   * const eth1 = new ETH(1);
   * const eth2 = new ETH(2);
   * (eth1.lt(eth2)); // true
   */
  lt(_other: InputType): boolean {
    const other = new ETH(_other);

    return this.wei < other.wei;
  }

  lte(_other: InputType): boolean {
    const other = new ETH(_other);

    return this.wei <= other.wei;
  }

  is(other: any): other is ETH {
    return this.__currencyType === other.__currencyType;
  }

  flip() {
    return ETH.fromWei(-this.wei);
  }
}
