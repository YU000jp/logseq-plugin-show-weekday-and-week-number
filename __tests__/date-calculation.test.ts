/**
 * Unit tests for date calculation logic in lib.ts.
 * Tests cover: getWeeklyNumberFromDate, getWeekStartFromWeekNumber,
 * getQuarterFromWeekNumber, and year-boundary edge cases.
 */

import {
  getWeeklyNumberFromDate,
  getWeekStartFromWeekNumber,
  getQuarterFromWeekNumber,
  getWeeklyNumberString,
} from '../src/lib';

// Mock logseq.settings for tests
const originalSettings = global.logseq?.settings;

beforeEach(() => {
  // @ts-ignore
  global.logseq = {
    settings: {
      weekNumberFormat: 'ISO(EU) format',
      weekNumberOptions: 'YYYY/Www',
    },
  };
});

afterEach(() => {
  // @ts-ignore
  global.logseq.settings = originalSettings;
});

describe('getQuarterFromWeekNumber', () => {
  it('returns Q1 for weeks 1-13', () => {
    expect(getQuarterFromWeekNumber(1)).toBe(1);
    expect(getQuarterFromWeekNumber(13)).toBe(1);
  });

  it('returns Q2 for weeks 14-26', () => {
    expect(getQuarterFromWeekNumber(14)).toBe(2);
    expect(getQuarterFromWeekNumber(26)).toBe(2);
  });

  it('returns Q3 for weeks 27-39', () => {
    expect(getQuarterFromWeekNumber(27)).toBe(3);
    expect(getQuarterFromWeekNumber(39)).toBe(3);
  });

  it('returns Q4 for weeks 40-53', () => {
    expect(getQuarterFromWeekNumber(40)).toBe(4);
    expect(getQuarterFromWeekNumber(52)).toBe(4);
    expect(getQuarterFromWeekNumber(53)).toBe(4);
  });
});

describe('getWeeklyNumberFromDate', () => {
  it('returns valid week number for a known ISO date', () => {
    // 2024-01-01 is Monday, ISO week 1
    const result = getWeeklyNumberFromDate(new Date(2024, 0, 1), 1);
    expect(result.year).toBe(2024);
    expect(result.weekString).toBe('01');
    expect(result.quarter).toBe(1);
  });

  it('handles year boundary - Dec 31 can be in next year\'s week 1 (ISO)', () => {
    // 2024-12-30 is Monday, ISO week 1 of 2025
    const result = getWeeklyNumberFromDate(new Date(2024, 11, 30), 1);
    expect(result.year).toBe(2025);
    expect(result.weekString).toBe('01');
  });

  it('handles year boundary - Jan 1 can be in previous year\'s week 52/53 (ISO)', () => {
    // 2021-01-01 is Friday, ISO week 53 of 2020
    const result = getWeeklyNumberFromDate(new Date(2021, 0, 1), 1);
    expect(result.year).toBe(2020);
    expect(result.weekString).toBe('53');
  });

  it('returns zero values for invalid date', () => {
    const result = getWeeklyNumberFromDate(new Date('invalid'), 1);
    expect(result.year).toBe(0);
    expect(result.weekString).toBe('00');
    expect(result.quarter).toBe(0);
  });

  it('pads week number to 2 digits', () => {
    const result = getWeeklyNumberFromDate(new Date(2024, 0, 1), 1);
    expect(result.weekString.length).toBe(2);
  });
});

describe('getWeekStartFromWeekNumber', () => {
  it('returns correct ISO week start date', () => {
    // ISO week 1 of 2024 starts on 2024-01-01 (Monday)
    const date = getWeekStartFromWeekNumber(2024, 1, 1, true);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(1);
  });

  it('returns correct US week start date (Sunday)', () => {
    // US week 1 of 2024 starts on 2024-01-01 (Sunday)
    const date = getWeekStartFromWeekNumber(2024, 1, 0, false);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('handles week 52', () => {
    const date = getWeekStartFromWeekNumber(2024, 52, 1, true);
    expect(date.getFullYear()).toBeGreaterThanOrEqual(2024);
  });
});

describe('getWeeklyNumberString', () => {
  beforeEach(() => {
    // @ts-ignore
    global.logseq.settings.weekNumberOptions = 'YYYY/Www';
  });

  it('returns default format YYYY/Www', () => {
    const result = getWeeklyNumberString(2024, '05', 2);
    expect(result).toBe('2024/W05');
  });

  it('returns YYYY-Www format', () => {
    // @ts-ignore
    global.logseq.settings.weekNumberOptions = 'YYYY-Www';
    const result = getWeeklyNumberString(2024, '05', 2);
    expect(result).toBe('2024-W05');
  });

  it('returns YYYY/qqq/Www format', () => {
    // @ts-ignore
    global.logseq.settings.weekNumberOptions = 'YYYY/qqq/Www';
    const result = getWeeklyNumberString(2024, '05', 2);
    expect(result).toBe('2024/Q2/W05');
  });

  it('returns YYYY-qqq-Www format', () => {
    // @ts-ignore
    global.logseq.settings.weekNumberOptions = 'YYYY-qqq-Www';
    const result = getWeeklyNumberString(2024, '05', 2);
    expect(result).toBe('2024-Q2-W05');
  });
});
