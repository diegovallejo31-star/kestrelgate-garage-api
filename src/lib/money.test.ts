import { bpsOf, formatPence, isWholePence, splitEvenly } from './money';

describe('pence', () => {
  it('knows a whole penny from a fraction of one', () => {
    expect(isWholePence(1250)).toBe(true);
    expect(isWholePence(12.5)).toBe(false);
  });

  it('formats an amount either side of zero', () => {
    expect(formatPence(1250)).toBe('12.50');
    expect(formatPence(5)).toBe('0.05');
    expect(formatPence(-1250)).toBe('-12.50');
    expect(formatPence(0)).toBe('0.00');
  });
});

describe('splitting an amount', () => {
  it('splits evenly where it divides', () => {
    expect(splitEvenly(1200, 4)).toEqual([300, 300, 300, 300]);
  });

  it('gives the odd pennies to the earlier shares', () => {
    expect(splitEvenly(1003, 4)).toEqual([251, 251, 251, 250]);
  });

  it('never loses a penny', () => {
    for (const amount of [1, 7, 99, 100_001]) {
      for (const parts of [2, 3, 4, 7, 12]) {
        expect(splitEvenly(amount, parts).reduce((a, b) => a + b, 0)).toBe(amount);
      }
    }
  });

  it('refuses to split into nothing', () => {
    expect(() => splitEvenly(100, 0)).toThrow();
  });
});

describe('basis points', () => {
  it('rounds down to the penny', () => {
    expect(bpsOf(10_000, 2000)).toBe(2000);
    expect(bpsOf(999, 2000)).toBe(199);
  });
});
