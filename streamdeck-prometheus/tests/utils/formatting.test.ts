/**
 * Tests for formatting utilities
 */

import {
  formatValue,
  formatNumber,
  formatPercentage,
  formatBytes,
  formatDuration,
  formatScientific,
  getThresholdStatus,
  getTrendIndicator,
  parseDuration,
  formatTimestamp,
} from '../../src/utils/formatting';
import type { FormatConfig, ThresholdConfig } from '../../src/types';

describe('formatValue', () => {
  it('should format a number with default config', () => {
    const config: FormatConfig = {};
    expect(formatValue(42, config)).toBe('42');
  });

  it('should format with unit suffix', () => {
    const config: FormatConfig = { unit: '%' };
    expect(formatValue(42, config)).toBe('42%');
  });

  it('should format with prefix', () => {
    const config: FormatConfig = { prefix: '$' };
    expect(formatValue(42, config)).toBe('$42');
  });

  it('should format with prefix and suffix', () => {
    const config: FormatConfig = { prefix: '$', unit: 'M' };
    expect(formatValue(42, config)).toBe('$42M');
  });

  it('should apply multiplier', () => {
    const config: FormatConfig = { multiplier: 2 };
    expect(formatValue(21, config)).toBe('42');
  });

  it('should apply divisor', () => {
    const config: FormatConfig = { divisor: 2 };
    expect(formatValue(84, config)).toBe('42');
  });

  it('should respect decimal places', () => {
    const config: FormatConfig = { decimals: 2 };
    expect(formatValue(42.567, config)).toBe('42.57');
  });

  it('should format as percentage', () => {
    const config: FormatConfig = { format: 'percentage', decimals: 1 };
    expect(formatValue(42.5, config)).toBe('42.5%');
  });

  it('should format as bytes', () => {
    const config: FormatConfig = { format: 'bytes', decimals: 2 };
    expect(formatValue(1024, config)).toBe('1.00 KB');
  });

  it('should format as duration', () => {
    const config: FormatConfig = { format: 'duration' };
    expect(formatValue(65, config)).toBe('1m5s');
  });

  it('should format as scientific', () => {
    const config: FormatConfig = { format: 'scientific', decimals: 2 };
    expect(formatValue(42000, config)).toBe('4.20e+4');
  });
});

describe('formatNumber', () => {
  it('should format integer without decimals', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('should format with specified decimals', () => {
    expect(formatNumber(42.567, 2)).toBe('42.57');
  });

  it('should format thousands with K suffix', () => {
    expect(formatNumber(1500, 1)).toBe('1.5K');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1500000, 1)).toBe('1.5M');
  });

  it('should format billions with B suffix', () => {
    expect(formatNumber(1500000000, 1)).toBe('1.5B');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1500, 1)).toBe('-1.5K');
  });

  it('should return N/A for non-finite values', () => {
    expect(formatNumber(Infinity)).toBe('N/A');
    expect(formatNumber(NaN)).toBe('N/A');
  });
});

describe('formatPercentage', () => {
  it('should format percentage with default decimals', () => {
    expect(formatPercentage(42.5)).toBe('42.5%');
  });

  it('should format percentage with specified decimals', () => {
    expect(formatPercentage(42.567, 2)).toBe('42.57%');
  });

  it('should handle 100%', () => {
    expect(formatPercentage(100, 0)).toBe('100%');
  });

  it('should return N/A for non-finite values', () => {
    expect(formatPercentage(Infinity)).toBe('N/A');
  });
});

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(500, 0)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024, 2)).toBe('1.00 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576, 2)).toBe('1.00 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824, 2)).toBe('1.00 GB');
  });

  it('should format terabytes', () => {
    expect(formatBytes(1099511627776, 2)).toBe('1.00 TB');
  });

  it('should handle zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should handle negative bytes', () => {
    expect(formatBytes(-1024, 2)).toBe('-1.00 KB');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(0.5)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(30)).toBe('30.0s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m5s');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(3725)).toBe('1h2m');
  });

  it('should format days and hours', () => {
    expect(formatDuration(90000)).toBe('1d1h');
  });

  it('should handle negative durations', () => {
    expect(formatDuration(-30)).toBe('-30.0s');
  });

  it('should return N/A for non-finite values', () => {
    expect(formatDuration(Infinity)).toBe('N/A');
  });
});

describe('formatScientific', () => {
  it('should format in scientific notation', () => {
    expect(formatScientific(42000, 2)).toBe('4.20e+4');
  });

  it('should handle small numbers', () => {
    expect(formatScientific(0.00042, 2)).toBe('4.20e-4');
  });

  it('should return N/A for non-finite values', () => {
    expect(formatScientific(Infinity)).toBe('N/A');
  });
});

describe('getThresholdStatus', () => {
  it('should return normal when no config', () => {
    expect(getThresholdStatus(50, null)).toBe('normal');
  });

  it('should return normal when below thresholds (higherIsBad)', () => {
    const config: ThresholdConfig = { warning: 75, critical: 90, higherIsBad: true };
    expect(getThresholdStatus(50, config)).toBe('normal');
  });

  it('should return warning when above warning threshold (higherIsBad)', () => {
    const config: ThresholdConfig = { warning: 75, critical: 90, higherIsBad: true };
    expect(getThresholdStatus(80, config)).toBe('warning');
  });

  it('should return critical when above critical threshold (higherIsBad)', () => {
    const config: ThresholdConfig = { warning: 75, critical: 90, higherIsBad: true };
    expect(getThresholdStatus(95, config)).toBe('critical');
  });

  it('should return normal when above thresholds (higherIsBad=false)', () => {
    const config: ThresholdConfig = { warning: 20, critical: 10, higherIsBad: false };
    expect(getThresholdStatus(50, config)).toBe('normal');
  });

  it('should return warning when below warning threshold (higherIsBad=false)', () => {
    const config: ThresholdConfig = { warning: 20, critical: 10, higherIsBad: false };
    expect(getThresholdStatus(15, config)).toBe('warning');
  });

  it('should return critical when below critical threshold (higherIsBad=false)', () => {
    const config: ThresholdConfig = { warning: 20, critical: 10, higherIsBad: false };
    expect(getThresholdStatus(5, config)).toBe('critical');
  });

  it('should handle only warning threshold', () => {
    const config: ThresholdConfig = { warning: 75 };
    expect(getThresholdStatus(80, config)).toBe('warning');
  });

  it('should handle only critical threshold', () => {
    const config: ThresholdConfig = { critical: 90 };
    expect(getThresholdStatus(95, config)).toBe('critical');
  });
});

describe('getTrendIndicator', () => {
  it('should return empty string when no previous value', () => {
    expect(getTrendIndicator(50, null)).toBe('');
  });

  it('should return up arrow when value increased significantly', () => {
    expect(getTrendIndicator(55, 50)).toBe('↑');
  });

  it('should return down arrow when value decreased significantly', () => {
    expect(getTrendIndicator(45, 50)).toBe('↓');
  });

  it('should return right arrow when value stayed relatively same', () => {
    expect(getTrendIndicator(50.3, 50)).toBe('→');
  });

  it('should handle non-finite current value', () => {
    expect(getTrendIndicator(Infinity, 50)).toBe('');
  });

  it('should handle non-finite previous value', () => {
    expect(getTrendIndicator(50, Infinity)).toBe('');
  });
});

describe('parseDuration', () => {
  it('should parse seconds', () => {
    expect(parseDuration('30s')).toBe(30);
  });

  it('should parse minutes', () => {
    expect(parseDuration('5m')).toBe(300);
  });

  it('should parse hours', () => {
    expect(parseDuration('2h')).toBe(7200);
  });

  it('should parse days', () => {
    expect(parseDuration('1d')).toBe(86400);
  });

  it('should parse weeks', () => {
    expect(parseDuration('1w')).toBe(604800);
  });

  it('should parse years', () => {
    expect(parseDuration('1y')).toBe(31536000);
  });

  it('should parse decimal values', () => {
    expect(parseDuration('1.5h')).toBe(5400);
  });

  it('should trim whitespace', () => {
    expect(parseDuration(' 5m ')).toBe(300);
  });

  it('should throw on invalid format', () => {
    expect(() => parseDuration('invalid')).toThrow('Invalid duration format');
    expect(() => parseDuration('5x')).toThrow('Invalid duration format');
    expect(() => parseDuration('')).toThrow('Invalid duration format');
  });
});

describe('formatTimestamp', () => {
  it('should format Date object', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = formatTimestamp(date);
    // Format depends on locale, so just check it's a non-empty string
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format ISO string', () => {
    const formatted = formatTimestamp('2024-01-15T10:30:00Z');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});
