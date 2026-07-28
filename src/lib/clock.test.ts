import {
  addDays,
  dayOf,
  daysBetween,
  earlierOf,
  formatMinutes,
  isDay,
  isStamp,
  laterOf,
  minutesBetween,
  windowsOverlap,
} from './clock';

describe('days', () => {
  it('takes a real day', () => {
    expect(isDay('2026-03-01')).toBe(true);
    expect(isDay('2024-02-29')).toBe(true);
  });

  it('turns down a day that never happened', () => {
    expect(isDay('2026-02-30')).toBe(false);
    expect(isDay('2026-13-01')).toBe(false);
    expect(isDay('2026-3-1')).toBe(false);
    expect(isDay('')).toBe(false);
  });

  it('counts the first day and not the last', () => {
    expect(daysBetween('2026-03-01', '2026-03-04')).toBe(3);
    expect(daysBetween('2026-03-04', '2026-03-01')).toBe(-3);
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('walks forwards and back over a month end', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-03-01', 0)).toBe('2026-03-01');
  });

  it('picks the later and the earlier of a pair', () => {
    expect(laterOf('2026-03-01', '2026-04-01')).toBe('2026-04-01');
    expect(earlierOf('2026-03-01', '2026-04-01')).toBe('2026-03-01');
  });
});

describe('stamps', () => {
  it('takes a minute-precision stamp and nothing else', () => {
    expect(isStamp('2026-03-01T07:30')).toBe(true);
    expect(isStamp('2026-03-01T07:30:00')).toBe(false);
    expect(isStamp('2026-03-01')).toBe(false);
    expect(isStamp('2026-03-01T25:00')).toBe(false);
  });

  it('reads the day off a stamp', () => {
    expect(dayOf('2026-03-01T07:30')).toBe('2026-03-01');
  });

  it('counts minutes in both directions', () => {
    expect(minutesBetween('2026-03-01T07:30', '2026-03-01T09:00')).toBe(90);
    expect(minutesBetween('2026-03-01T09:00', '2026-03-01T07:30')).toBe(-90);
  });
});

describe('overlapping windows', () => {
  it('sees an overlap where the two share a day', () => {
    expect(windowsOverlap('2026-03-01', '2026-03-05', '2026-03-04', '2026-03-08')).toBe(
      true,
    );
  });

  it('sees none where one starts the day the other ends', () => {
    expect(windowsOverlap('2026-03-01', '2026-03-04', '2026-03-04', '2026-03-08')).toBe(
      false,
    );
  });

  it('sees an overlap where one swallows the other', () => {
    expect(windowsOverlap('2026-03-01', '2026-03-31', '2026-03-10', '2026-03-12')).toBe(
      true,
    );
  });
});

describe('formatting minutes', () => {
  it('writes a clock time', () => {
    expect(formatMinutes(90)).toBe('01:30');
    expect(formatMinutes(1140)).toBe('19:00');
    expect(formatMinutes(-90)).toBe('-01:30');
  });
});
