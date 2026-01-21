/**
 * Test utility functions for Stream Deck Prometheus Plugin
 */

import type { PrometheusSettings } from '../../src/types';

interface MockActionEvent {
  action: {
    setTitle: jest.Mock;
    setSettings: jest.Mock;
    setImage: jest.Mock;
    showAlert: jest.Mock;
    showOk: jest.Mock;
  };
  payload: {
    settings: Partial<PrometheusSettings> & { endpoint: string; query: string; unit: string };
  };
}

interface MockPrometheusResponse {
  resultType: 'vector';
  result: {
    metric: Record<string, string>;
    value: {
      time: Date;
      value: string;
    };
  }[];
}

interface MockRangeResponse {
  resultType: 'matrix';
  result: {
    metric: Record<string, string>;
    values: {
      time: Date;
      value: string;
    }[];
  }[];
}

interface MockEmptyResponse {
  resultType: 'vector';
  result: never[];
}

interface MockMalformedResponse {
  resultType: 'vector';
  result: {
    metric: Record<string, never>;
    value: null;
  }[];
}

interface MockInvalidValueResponse {
  resultType: 'vector';
  result: {
    metric: Record<string, never>;
    value: {
      time: Date;
      value: string;
    };
  }[];
}

interface MockPrometheusDriver {
  instantQuery: jest.Mock;
  rangeQuery: jest.Mock;
}

/**
 * Create a mock StreamDeck action event
 */
export function createMockActionEvent(settings: Partial<PrometheusSettings> = {}): MockActionEvent {
  return {
    action: {
      setTitle: jest.fn().mockResolvedValue(undefined),
      setSettings: jest.fn().mockResolvedValue(undefined),
      setImage: jest.fn().mockResolvedValue(undefined),
      showAlert: jest.fn().mockResolvedValue(undefined),
      showOk: jest.fn().mockResolvedValue(undefined),
    },
    payload: {
      settings: {
        endpoint: 'https://prometheus.example.com:9090',
        query: 'up{job="prometheus"}',
        unit: '',
        ...settings,
      },
    },
  };
}

/**
 * Create a mock Prometheus instant query response
 */
export function createMockPrometheusResponse(
  value: number | string = 42,
  labels: Record<string, string> = { job: 'prometheus' }
): MockPrometheusResponse {
  return {
    resultType: 'vector' as const,
    result: [
      {
        metric: labels,
        value: {
          time: new Date(),
          value: String(value),
        },
      },
    ],
  };
}

/**
 * Create a mock Prometheus range query response
 */
export function createMockRangeResponse(
  values: number[] = [10, 20, 30],
  labels: Record<string, string> = { job: 'prometheus' }
): MockRangeResponse {
  return {
    resultType: 'matrix' as const,
    result: [
      {
        metric: labels,
        values: values.map((v, i) => ({
          time: new Date(Date.now() - (values.length - i) * 60000),
          value: String(v),
        })),
      },
    ],
  };
}

/**
 * Create a mock Prometheus response with multiple results
 */
export function createMockMultiResultResponse(
  results: { value: number; labels: Record<string, string> }[]
): MockPrometheusResponse {
  return {
    resultType: 'vector' as const,
    result: results.map((r) => ({
      metric: r.labels,
      value: {
        time: new Date(),
        value: String(r.value),
      },
    })),
  };
}

/**
 * Create an empty Prometheus response
 */
export function createEmptyPrometheusResponse(): MockEmptyResponse {
  return {
    resultType: 'vector' as const,
    result: [],
  };
}

/**
 * Create a malformed Prometheus response for testing error cases
 */
export function createMalformedPrometheusResponse(): MockMalformedResponse {
  return {
    resultType: 'vector' as const,
    result: [
      {
        metric: {},
        value: null,
      },
    ],
  };
}

/**
 * Create a response with invalid value
 */
export function createInvalidValueResponse(): MockInvalidValueResponse {
  return {
    resultType: 'vector' as const,
    result: [
      {
        metric: {},
        value: {
          time: new Date(),
          value: 'not-a-number',
        },
      },
    ],
  };
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock error with specific message
 */
export function createMockError(message: string): Error {
  const error = new Error(message);
  error.name = 'MockError';
  return error;
}

/**
 * Create complete settings for testing
 */
export function createCompleteSettings(): PrometheusSettings {
  return {
    endpoint: 'https://prometheus.example.com:9090',
    query: 'up{job="prometheus"}',
    unit: '%',
    metricType: 'instant',
    timeout: 10000,
    refreshInterval: 5000,
    showTrend: false,
    debug: false,
    formatConfig: JSON.stringify({
      format: 'number',
      decimals: 2,
      unit: '%',
    }),
    thresholdConfig: JSON.stringify({
      warning: 75,
      critical: 90,
      higherIsBad: true,
    }),
  };
}

/**
 * Create settings for range query testing
 */
export function createRangeQuerySettings(): PrometheusSettings {
  return {
    ...createCompleteSettings(),
    metricType: 'range',
    rangeConfig: JSON.stringify({
      duration: '1h',
      aggregation: 'avg',
    }),
  };
}

/**
 * Create a mock PrometheusDriver
 */
export function createMockPrometheusDriver(): MockPrometheusDriver {
  return {
    instantQuery: jest.fn(),
    rangeQuery: jest.fn(),
  };
}

/**
 * Assert that a function was called with expected settings
 */
export function expectSettingsContain(
  mockFn: jest.Mock,
  expectedSettings: Partial<PrometheusSettings>
): void {
  expect(mockFn).toHaveBeenCalled();
  const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1] as [Record<string, unknown>];
  const settings = lastCall[0];

  for (const [key, value] of Object.entries(expectedSettings)) {
    expect(settings[key]).toEqual(value);
  }
}
