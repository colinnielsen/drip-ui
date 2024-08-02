import { USDC } from '@/data-model/_common/currency/USDC';
import { expect, test, describe } from 'vitest';

describe('USDC', () => {
  test('constructor and fromUSD', () => {
    expect(new USDC(1).wei).toBe(1000000n);
    expect(USDC.fromUSD(1).wei).toBe(1000000n);
    expect(new USDC(0.01).wei).toBe(10000n);
    expect(new USDC(undefined as unknown as any).wei).toBe(0n);
    expect(new USDC('').wei).toBe(0n);
    expect(new USDC(1000000).wei).toBe(1000000000000n);
    expect(new USDC('1.23456789').wei).toBe(1234567n);
    expect(new USDC(1.23456789).wei).toBe(1234567n);
  });

  test('fromWei', () => {
    expect(USDC.fromWei(1000000).toUSD()).toBe(1);
    expect(USDC.fromWei('500000').toUSD()).toBe(0.5);
    expect(USDC.fromWei(1n).toUSD()).toBe(0.000001);
  });

  test('arithmetic operations', () => {
    const one = new USDC(1);
    const half = new USDC(0.5);

    expect(one.add(half).toUSD()).toBe(1.5);
    expect(one.sub(half).toUSD()).toBe(0.5);
    expect(one.mul(2).toUSD()).toBe(2);
    expect(one.div(2).toUSD()).toBe(0.5);

    // Test with very small numbers
    expect(new USDC(0.000001).add(0.000001).toUSD()).toBe(0.000002);
    expect(new USDC(0.000001).sub(0.000001).toUSD()).toBe(0);

    // Test with large numbers
    expect(new USDC(1000).mul(2).toUSD()).toBe(2000);
    expect(new USDC(1000).div(2).toUSD()).toBe(500);
  });

  test('comparison operations', () => {
    const one = new USDC(1);
    const two = new USDC(2);

    expect(one.eq(new USDC(1))).toBe(true);
    expect(one.eq(two)).toBe(false);
    expect(one.lt(two)).toBe(true);
    expect(two.gt(one)).toBe(true);
  });

  test('formatting', () => {
    expect(new USDC(1).prettyFormat()).toBe('1.00');
    expect(new USDC(0.01).prettyFormat()).toBe('0.01');
    expect(new USDC(1000000).prettyFormat()).toBe('1,000,000.00');
    expect(new USDC(-1.5).prettyFormat()).toBe('-1.50');
  });

  test('toJSON and rehydrate', () => {
    const original = new USDC(123.45);
    const json = original.toJSON();
    const rehydrated = USDC.fromJSON(json);

    expect(rehydrated.toUSD()).toBe(123.45);
    expect(rehydrated.eq(original)).toBe(true);
  });

  test('percentageOf', () => {
    const oneK = new USDC(1000);
    expect(oneK.percentageOf({ percent: 50 }).toUSD()).toBe(500);
    expect(oneK.percentageOf({ percent: 0.1 }).toUSD()).toBe(1);
    expect(oneK.percentageOf({ percent: 0.01 }).toUSD()).toBe(0.1);
    expect(oneK.percentageOf({ percent: 0.001 }).toUSD()).toBe(0.01);
  });

  test('floating point precision', () => {
    const point3 = new USDC(0.1).add(0.2);
    // Test for potential floating point errors
    expect(point3.toUSD()).toBe(0.3);
    expect(point3.wei).toBe(300_000n);
    expect(point3.toWeiNumber()).toBe(300_000);
    expect(point3.toWeiString()).toBe('300000');
    expect(point3.toWei()).toBe(300_000n);
    const point2 = new USDC(0.3).sub(0.1);
    expect(point2.toUSD()).toBe(0.2);
    expect(point2.wei).toBe(200_000n);
    expect(point2.toWeiNumber()).toBe(200_000);
    expect(point2.toWeiString()).toBe('200000');
    expect(point2.toWei()).toBe(200_000n);

    const largeNumber = new USDC(1234.59);
    expect(largeNumber.mul(0.1).toUSD()).toBe(123.459);
    expect(largeNumber.mul(0.1).toWeiNumber()).toBe(123459000);
    expect(largeNumber.mul(0.1).toWeiString()).toBe('123459000');
    expect(largeNumber.mul(0.1).toWei()).toBe(123459000n);
    expect(largeNumber.mul(0.1).toWeiString()).toBe('123459000');
    expect(largeNumber.mul(0.1).toWei()).toBe(123459000n);
  });

  test('edge cases', () => {
    expect(new USDC(0).toUSD()).toBe(0);
    expect(new USDC(-0).toUSD()).toBe(0);
    expect(() => new USDC(Number.MAX_VALUE / 1_000_000)).toThrow();
  });

  test('constructor and fromUSD edge cases', () => {
    expect(() => new USDC('invalid')).toThrow();
    expect(() => new USDC(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      'Amount too large',
    );
    expect(new USDC(0).wei).toBe(0n);
    expect(new USDC(-0).wei).toBe(0n);
    expect(new USDC(0.000001).wei).toBe(1n);
    expect(new USDC(0.0000001).wei).toBe(0n);
  });

  test('fromWei edge cases', () => {
    expect(USDC.fromWei(0).toUSD()).toBe(0);
    expect(USDC.fromWei(-0).toUSD()).toBe(0);
    expect(USDC.fromWei(1).toUSD()).toBe(0.000001);
    expect(USDC.fromWei(0.5).toUSD()).toBe(0);
  });

  test('arithmetic operations edge cases', () => {
    const zero = new USDC(0);
    const one = new USDC(1);

    expect(zero.add(0).toUSD()).toBe(0);
    expect(zero.sub(0).toUSD()).toBe(0);
    expect(zero.mul(0).toUSD()).toBe(0);
    expect(() => zero.div(0)).toThrow();

    expect(one.add(0).toUSD()).toBe(1);
    expect(one.sub(0).toUSD()).toBe(1);
    expect(one.mul(0).toUSD()).toBe(0);
    expect(one.div(1).toUSD()).toBe(1);
  });

  test('conversion edge cases', () => {
    expect(new USDC(1).toWei()).toBe(1000000n);
    expect(new USDC(1).toWeiString()).toBe('1000000');
    expect(new USDC(1).toWeiNumber()).toBe(1000000);

    expect(new USDC(0.000001).toWei()).toBe(1n);
    expect(new USDC(0.000001).toWeiString()).toBe('1');
    expect(new USDC(0.000001).toWeiNumber()).toBe(1);

    expect(new USDC(0.0000001).toWei()).toBe(0n);
    expect(new USDC(0.0000001).toWeiString()).toBe('0');
    expect(new USDC(0.0000001).toWeiNumber()).toBe(0);
  });

  test('toJSON and rehydrate edge cases', () => {
    const zero = new USDC(0);
    const json = zero.toJSON();
    const rehydrated = USDC.fromJSON(json);

    expect(rehydrated.toUSD()).toBe(0);
    expect(rehydrated.eq(zero)).toBe(true);

    const negative = new USDC(-1);
    const negativeJson = negative.toJSON();
    const rehydratedNegative = USDC.fromJSON(negativeJson);

    expect(rehydratedNegative.toUSD()).toBe(-1);
    expect(rehydratedNegative.eq(negative)).toBe(true);

    const small = new USDC(0.00001);
    const smallJson = small.toJSON();
    const rehydratedSmall = USDC.fromJSON(smallJson);

    expect(rehydratedSmall.toUSD()).toBe(0.00001);
    expect(rehydratedSmall.eq(small)).toBe(true);
  });

  test('percentageOf edge cases', () => {
    const amount = new USDC(34.5);
    expect(amount.percentageOf({ percent: 0 }).toUSD()).toBe(0);
    expect(amount.percentageOf({ percent: 15 }).toUSD()).toBe(5.175);
    expect(amount.percentageOf({ percent: 0.5 }).toUSD()).toBe(0.1725);
    expect(amount.percentageOf({ percent: 50 }).toUSD()).toBe(17.25);
  });
});
