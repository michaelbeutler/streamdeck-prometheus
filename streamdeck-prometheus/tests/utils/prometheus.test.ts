/**
 * Tests for Prometheus query utilities
 */

import { aggregate, createPrometheusDriver, executeQuery } from '../../src/utils/prometheus';
import type { ParsedPrometheusSettings, AggregationType } from '../../src/types';

// Mock prometheus-query
jest.mock('prometheus-query', () => ({
  PrometheusDriver: jest.fn().mockImplementation(() => ({
    instantQuery: jest.fn(),
    rangeQuery: jest.fn(),
  })),
}));

describe('createPrometheusDriver', () => {
  it('should create a PrometheusDriver instance', () => {
    const driver = createPrometheusDriver('https://prometheus.example.com', 10000);
    expect(driver).toBeDefined();
    expect(driver.instantQuery).toBeDefined();
    expect(driver.rangeQuery).toBeDefined();
  });
});

describe('aggregate', () => {
  describe('avg', () => {
    it('should calculate average', () => {
      expect(aggregate([10, 20, 30], 'avg')).toBe(20);
    });

    it('should handle single value', () => {
      expect(aggregate([42], 'avg')).toBe(42);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate([], 'avg')).toBe(0);
    });
  });

  describe('sum', () => {
    it('should calculate sum', () => {
      expect(aggregate([10, 20, 30], 'sum')).toBe(60);
    });

    it('should handle negative values', () => {
      expect(aggregate([10, -20, 30], 'sum')).toBe(20);
    });
  });

  describe('min', () => {
    it('should find minimum', () => {
      expect(aggregate([10, 5, 30], 'min')).toBe(5);
    });

    it('should handle negative values', () => {
      expect(aggregate([10, -5, 30], 'min')).toBe(-5);
    });
  });

  describe('max', () => {
    it('should find maximum', () => {
      expect(aggregate([10, 5, 30], 'max')).toBe(30);
    });

    it('should handle negative values', () => {
      expect(aggregate([-10, -5, -30], 'max')).toBe(-5);
    });
  });

  describe('count', () => {
    it('should count values', () => {
      expect(aggregate([10, 20, 30], 'count')).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate([], 'count')).toBe(0);
    });
  });

  describe('first', () => {
    it('should return first value', () => {
      expect(aggregate([10, 20, 30], 'first')).toBe(10);
    });
  });

  describe('last', () => {
    it('should return last value', () => {
      expect(aggregate([10, 20, 30], 'last')).toBe(30);
    });
  });

  describe('rate', () => {
    it('should calculate rate of change', () => {
      // Rate = (last - first) / (count - 1)
      expect(aggregate([10, 15, 20], 'rate')).toBe(5);
    });

    it('should return 0 for single value', () => {
      expect(aggregate([10], 'rate')).toBe(0);
    });

    it('should handle negative rate', () => {
      expect(aggregate([20, 15, 10], 'rate')).toBe(-5);
    });
  });
});

describe('executeQuery', () => {
  let mockDriver: {
    instantQuery: jest.Mock;
    rangeQuery: jest.Mock;
  };

  beforeEach(() => {
    mockDriver = {
      instantQuery: jest.fn(),
      rangeQuery: jest.fn(),
    };
  });

  const baseSettings: ParsedPrometheusSettings = {
    endpoint: 'https://prometheus.example.com',
    timeout: 10000,
    headers: {},
    query: 'up{job="prometheus"}',
    metricType: 'instant',
    rangeConfig: null,
    formatConfig: { decimals: 0, format: 'number' },
    thresholdConfig: null,
    labelConfig: { resultIndex: 0 },
    refreshInterval: 5000,
    showTrend: false,
    debug: false,
  };

  describe('instant queries', () => {
    it('should execute instant query and return result', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [
          {
            metric: { job: 'prometheus' },
            value: { time: new Date(), value: '42' },
          },
        ],
      });

      const result = await executeQuery(mockDriver as any, baseSettings);

      expect(mockDriver.instantQuery).toHaveBeenCalledWith('up{job="prometheus"}');
      expect(result.value).toBe(42);
      expect(result.labels).toEqual({ job: 'prometheus' });
    });

    it('should throw error when no data returned', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [],
      });

      await expect(executeQuery(mockDriver as any, baseSettings)).rejects.toThrow(
        'No data returned from Prometheus'
      );
    });

    it('should throw error when value is missing', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [{ metric: {}, value: null }],
      });

      await expect(executeQuery(mockDriver as any, baseSettings)).rejects.toThrow(
        'Invalid value in Prometheus response'
      );
    });

    it('should throw error when value is not a number', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [
          {
            metric: {},
            value: { time: new Date(), value: 'not-a-number' },
          },
        ],
      });

      await expect(executeQuery(mockDriver as any, baseSettings)).rejects.toThrow(
        'Could not parse value as number'
      );
    });

    it('should use resultIndex from label config', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [
          { metric: { instance: 'first' }, value: { time: new Date(), value: '10' } },
          { metric: { instance: 'second' }, value: { time: new Date(), value: '20' } },
        ],
      });

      const settings = {
        ...baseSettings,
        labelConfig: { resultIndex: 1 },
      };

      const result = await executeQuery(mockDriver as any, settings);

      expect(result.value).toBe(20);
      expect(result.labels.instance).toBe('second');
    });

    it('should filter by label', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [
          { metric: { instance: 'host1' }, value: { time: new Date(), value: '10' } },
          { metric: { instance: 'host2' }, value: { time: new Date(), value: '20' } },
        ],
      });

      const settings = {
        ...baseSettings,
        labelConfig: { labelName: 'instance', labelFilter: 'host2', resultIndex: 0 },
      };

      const result = await executeQuery(mockDriver as any, settings);

      expect(result.value).toBe(20);
    });
  });

  describe('range queries', () => {
    it('should execute range query and aggregate results', async () => {
      mockDriver.rangeQuery.mockResolvedValue({
        result: [
          {
            metric: { job: 'prometheus' },
            values: [
              { time: new Date(), value: '10' },
              { time: new Date(), value: '20' },
              { time: new Date(), value: '30' },
            ],
          },
        ],
      });

      const settings: ParsedPrometheusSettings = {
        ...baseSettings,
        metricType: 'range',
        rangeConfig: {
          duration: '1h',
          aggregation: 'avg',
        },
      };

      const result = await executeQuery(mockDriver as any, settings);

      expect(mockDriver.rangeQuery).toHaveBeenCalled();
      expect(result.value).toBe(20); // avg of 10, 20, 30
    });

    it('should throw error when no range config for range query', async () => {
      const settings: ParsedPrometheusSettings = {
        ...baseSettings,
        metricType: 'range',
        rangeConfig: null,
      };

      await expect(executeQuery(mockDriver as any, settings)).rejects.toThrow(
        'Range configuration is required for range queries'
      );
    });

    it('should throw error when no values in range result', async () => {
      mockDriver.rangeQuery.mockResolvedValue({
        result: [{ metric: {}, values: [] }],
      });

      const settings: ParsedPrometheusSettings = {
        ...baseSettings,
        metricType: 'range',
        rangeConfig: {
          duration: '1h',
          aggregation: 'avg',
        },
      };

      await expect(executeQuery(mockDriver as any, settings)).rejects.toThrow(
        'No values found for range query'
      );
    });

    it('should apply different aggregations', async () => {
      const values = [
        { time: new Date(), value: '10' },
        { time: new Date(), value: '20' },
        { time: new Date(), value: '30' },
      ];

      mockDriver.rangeQuery.mockResolvedValue({
        result: [{ metric: {}, values }],
      });

      const aggregations: Array<{ type: AggregationType; expected: number }> = [
        { type: 'avg', expected: 20 },
        { type: 'sum', expected: 60 },
        { type: 'min', expected: 10 },
        { type: 'max', expected: 30 },
        { type: 'count', expected: 3 },
        { type: 'first', expected: 10 },
        { type: 'last', expected: 30 },
      ];

      for (const { type, expected } of aggregations) {
        const settings: ParsedPrometheusSettings = {
          ...baseSettings,
          metricType: 'range',
          rangeConfig: {
            duration: '1h',
            aggregation: type,
          },
        };

        const result = await executeQuery(mockDriver as any, settings);
        expect(result.value).toBe(expected);
      }
    });
  });

  describe('series queries', () => {
    it('should execute series query (same as instant with label focus)', async () => {
      mockDriver.instantQuery.mockResolvedValue({
        result: [
          {
            metric: { job: 'prometheus', instance: 'localhost:9090' },
            value: { time: new Date(), value: '1' },
          },
        ],
      });

      const settings: ParsedPrometheusSettings = {
        ...baseSettings,
        metricType: 'series',
      };

      const result = await executeQuery(mockDriver as any, settings);

      expect(mockDriver.instantQuery).toHaveBeenCalled();
      expect(result.value).toBe(1);
      expect(result.labels.instance).toBe('localhost:9090');
    });
  });
});
