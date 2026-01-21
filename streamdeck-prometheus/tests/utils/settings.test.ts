/**
 * Tests for settings utilities
 */

import { parseSettings, validateSettings, mergeWithDefaults } from '../../src/utils/settings';
import type { PrometheusSettings, ParsedPrometheusSettings } from '../../src/types';

// Mock the config module
jest.mock('../../src/config.json', () => ({
  prometheus: {
    endpoint: '',
    timeout: 10000,
    refreshInterval: 5000,
    maxRetries: 3,
  },
  defaultQuery: '',
  defaultUnit: '',
}));

describe('parseSettings', () => {
  it('should parse minimal settings with defaults', () => {
    const settings: PrometheusSettings = {};
    const parsed = parseSettings(settings);

    expect(parsed.endpoint).toBe('');
    expect(parsed.timeout).toBe(10000);
    expect(parsed.query).toBe('');
    expect(parsed.metricType).toBe('instant');
    expect(parsed.refreshInterval).toBe(5000);
    expect(parsed.showTrend).toBe(false);
    expect(parsed.debug).toBe(false);
  });

  it('should parse endpoint correctly', () => {
    const settings: PrometheusSettings = {
      endpoint: 'https://prometheus.example.com:9090',
    };
    const parsed = parseSettings(settings);
    expect(parsed.endpoint).toBe('https://prometheus.example.com:9090');
  });

  it('should parse timeout correctly', () => {
    const settings: PrometheusSettings = {
      timeout: 30000,
    };
    const parsed = parseSettings(settings);
    expect(parsed.timeout).toBe(30000);
  });

  it('should parse metric type correctly', () => {
    const settings: PrometheusSettings = {
      metricType: 'range',
    };
    const parsed = parseSettings(settings);
    expect(parsed.metricType).toBe('range');
  });

  it('should default invalid metric type to instant', () => {
    const settings: PrometheusSettings = {
      metricType: 'invalid' as any,
    };
    const parsed = parseSettings(settings);
    expect(parsed.metricType).toBe('instant');
  });

  it('should parse range config from JSON string', () => {
    const settings: PrometheusSettings = {
      rangeConfig: JSON.stringify({
        duration: '1h',
        aggregation: 'avg',
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.rangeConfig).toEqual({
      duration: '1h',
      step: undefined,
      aggregation: 'avg',
    });
  });

  it('should return null for invalid range config', () => {
    const settings: PrometheusSettings = {
      rangeConfig: 'invalid json',
    };
    const parsed = parseSettings(settings);
    expect(parsed.rangeConfig).toBeNull();
  });

  it('should parse format config from JSON string', () => {
    const settings: PrometheusSettings = {
      formatConfig: JSON.stringify({
        decimals: 2,
        format: 'percentage',
        unit: '%',
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.formatConfig.decimals).toBe(2);
    expect(parsed.formatConfig.format).toBe('percentage');
    expect(parsed.formatConfig.unit).toBe('%');
  });

  it('should use unit from settings if formatConfig has no unit', () => {
    const settings: PrometheusSettings = {
      unit: 'MB',
      formatConfig: JSON.stringify({
        decimals: 1,
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.formatConfig.unit).toBe('MB');
  });

  it('should parse threshold config from JSON string', () => {
    const settings: PrometheusSettings = {
      thresholdConfig: JSON.stringify({
        warning: 75,
        critical: 90,
        higherIsBad: true,
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.thresholdConfig).toEqual({
      warning: 75,
      critical: 90,
      higherIsBad: true,
    });
  });

  it('should return null for empty threshold config', () => {
    const settings: PrometheusSettings = {
      thresholdConfig: JSON.stringify({}),
    };
    const parsed = parseSettings(settings);
    expect(parsed.thresholdConfig).toBeNull();
  });

  it('should parse label config from JSON string', () => {
    const settings: PrometheusSettings = {
      labelConfig: JSON.stringify({
        labelName: 'instance',
        labelFilter: 'localhost:9090',
        resultIndex: 1,
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.labelConfig).toEqual({
      labelName: 'instance',
      labelFilter: 'localhost:9090',
      resultIndex: 1,
    });
  });

  it('should parse headers from JSON string', () => {
    const settings: PrometheusSettings = {
      headers: JSON.stringify({
        Authorization: 'Bearer token123',
      }),
    };
    const parsed = parseSettings(settings);
    expect(parsed.headers).toEqual({
      Authorization: 'Bearer token123',
    });
  });

  it('should parse boolean flags correctly', () => {
    const settings: PrometheusSettings = {
      showTrend: true,
      debug: true,
    };
    const parsed = parseSettings(settings);
    expect(parsed.showTrend).toBe(true);
    expect(parsed.debug).toBe(true);
  });
});

describe('validateSettings', () => {
  it('should return error for missing endpoint', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: '',
      timeout: 10000,
      headers: {},
      query: 'up',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('Prometheus endpoint is required');
  });

  it('should return error for invalid endpoint URL', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'not-a-url',
      timeout: 10000,
      headers: {},
      query: 'up',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('Prometheus endpoint must be a valid HTTP/HTTPS URL');
  });

  it('should return error for missing query', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'https://prometheus.example.com',
      timeout: 10000,
      headers: {},
      query: '',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('PromQL query is required');
  });

  it('should return error for range query without range config', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'https://prometheus.example.com',
      timeout: 10000,
      headers: {},
      query: 'up',
      metricType: 'range',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('Range configuration is required for range queries');
  });

  it('should return error for timeout below 1000ms', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'https://prometheus.example.com',
      timeout: 500,
      headers: {},
      query: 'up',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('Timeout must be at least 1000ms');
  });

  it('should return error for refresh interval below 1000ms', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'https://prometheus.example.com',
      timeout: 10000,
      headers: {},
      query: 'up',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 500,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toContain('Refresh interval must be at least 1000ms');
  });

  it('should return empty array for valid settings', () => {
    const settings: ParsedPrometheusSettings = {
      endpoint: 'https://prometheus.example.com',
      timeout: 10000,
      headers: {},
      query: 'up',
      metricType: 'instant',
      rangeConfig: null,
      formatConfig: { decimals: 0, format: 'number' },
      thresholdConfig: null,
      labelConfig: { resultIndex: 0 },
      refreshInterval: 5000,
      showTrend: false,
      debug: false,
    };
    const errors = validateSettings(settings);
    expect(errors).toHaveLength(0);
  });
});

describe('mergeWithDefaults', () => {
  it('should merge partial settings with defaults', () => {
    const settings: Partial<PrometheusSettings> = {
      endpoint: 'https://prometheus.example.com',
    };
    const merged = mergeWithDefaults(settings);

    expect(merged.endpoint).toBe('https://prometheus.example.com');
    expect(merged.timeout).toBe(10000);
    expect(merged.query).toBe('');
    expect(merged.metricType).toBe('instant');
  });

  it('should preserve provided values', () => {
    const settings: Partial<PrometheusSettings> = {
      timeout: 30000,
      query: 'up{job="prometheus"}',
      unit: '%',
    };
    const merged = mergeWithDefaults(settings);

    expect(merged.timeout).toBe(30000);
    expect(merged.query).toBe('up{job="prometheus"}');
    expect(merged.unit).toBe('%');
  });

  it('should not overwrite falsy values with defaults', () => {
    const settings: Partial<PrometheusSettings> = {
      showTrend: false,
      debug: false,
    };
    const merged = mergeWithDefaults(settings);

    expect(merged.showTrend).toBe(false);
    expect(merged.debug).toBe(false);
  });
});
