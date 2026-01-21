/**
 * Prometheus query utilities
 */

import { PrometheusDriver } from 'prometheus-query';
import type {
  ParsedPrometheusSettings,
  AggregationType,
  RangeQueryConfig,
  LabelConfig,
} from '../types.js';
import { parseDuration } from './formatting.js';

/**
 * Result from a Prometheus query
 */
export interface QueryResult {
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  raw: unknown;
}

/**
 * Internal type for Prometheus result items
 */
interface PrometheusResultItem {
  metric?: Record<string, string>;
  value?: {
    time?: Date | number | string;
    value?: string | number;
  };
  values?: {
    time?: Date | number | string;
    value?: string | number;
  }[];
}

/**
 * Create a Prometheus driver instance
 */
export function createPrometheusDriver(
  endpoint: string,
  timeout: number,
  _headers?: Record<string, string>
): PrometheusDriver {
  return new PrometheusDriver({
    endpoint,
    timeout,
  });
}

/**
 * Execute a Prometheus query based on settings
 */
export async function executeQuery(
  driver: PrometheusDriver,
  settings: ParsedPrometheusSettings
): Promise<QueryResult> {
  const { query, metricType, rangeConfig, labelConfig } = settings;

  switch (metricType) {
    case 'range':
      if (!rangeConfig) {
        throw new Error('Range configuration is required for range queries');
      }
      return executeRangeQuery(driver, query, rangeConfig, labelConfig);

    case 'series':
      return executeSeriesQuery(driver, query, labelConfig);

    case 'instant':
    default:
      return executeInstantQuery(driver, query, labelConfig);
  }
}

/**
 * Execute an instant query
 */
async function executeInstantQuery(
  driver: PrometheusDriver,
  query: string,
  labelConfig: LabelConfig
): Promise<QueryResult> {
  const result = await driver.instantQuery(query);
  const resultArray = result.result as PrometheusResultItem[] | undefined;

  if (!resultArray || resultArray.length === 0) {
    throw new Error('No data returned from Prometheus');
  }

  const resultIndex = labelConfig.resultIndex ?? 0;
  const filteredResults = filterByLabel(resultArray, labelConfig);
  const selectedResult = filteredResults[resultIndex];

  if (!selectedResult) {
    throw new Error(`No result found at index ${resultIndex}`);
  }

  const valueObj = selectedResult.value;
  if (!valueObj) {
    throw new Error('Invalid value in Prometheus response');
  }

  const rawValue = valueObj.value;
  if (rawValue === undefined || rawValue === null) {
    throw new Error('Invalid value in Prometheus response');
  }

  const numericValue = parseFloat(String(rawValue));
  if (isNaN(numericValue)) {
    throw new Error(`Could not parse value as number: ${rawValue}`);
  }

  return {
    value: numericValue,
    timestamp: valueObj.time ? new Date(valueObj.time) : new Date(),
    labels: selectedResult.metric ?? {},
    raw: result,
  };
}

/**
 * Execute a range query with aggregation
 */
async function executeRangeQuery(
  driver: PrometheusDriver,
  query: string,
  rangeConfig: RangeQueryConfig,
  labelConfig: LabelConfig
): Promise<QueryResult> {
  const endTime = new Date();
  const durationSeconds = parseDuration(rangeConfig.duration);
  const startTime = new Date(endTime.getTime() - durationSeconds * 1000);

  // Default step to duration / 60 for reasonable granularity
  const step = rangeConfig.step ?? `${Math.max(1, Math.floor(durationSeconds / 60))}s`;

  const result = await driver.rangeQuery(query, startTime, endTime, step);
  const resultArray = result.result as PrometheusResultItem[] | undefined;

  if (!resultArray || resultArray.length === 0) {
    throw new Error('No data returned from Prometheus range query');
  }

  const resultIndex = labelConfig.resultIndex ?? 0;
  const filteredResults = filterByLabel(resultArray, labelConfig);
  const selectedResult = filteredResults[resultIndex];

  if (!selectedResult) {
    throw new Error(`No values found for range query at index ${resultIndex}`);
  }

  const valuesArray = selectedResult.values;
  if (!valuesArray || valuesArray.length === 0) {
    throw new Error(`No values found for range query at index ${resultIndex}`);
  }

  const values = valuesArray.map((v) => parseFloat(String(v.value)));
  const validValues = values.filter((v) => !isNaN(v));

  if (validValues.length === 0) {
    throw new Error('No valid numeric values in range query result');
  }

  const aggregatedValue = aggregate(validValues, rangeConfig.aggregation);

  return {
    value: aggregatedValue,
    timestamp: endTime,
    labels: selectedResult.metric ?? {},
    raw: result,
  };
}

/**
 * Execute a series query (like instant but with label focus)
 */
async function executeSeriesQuery(
  driver: PrometheusDriver,
  query: string,
  labelConfig: LabelConfig
): Promise<QueryResult> {
  // Series query is similar to instant but focuses on label extraction
  return executeInstantQuery(driver, query, labelConfig);
}

/**
 * Filter results by label
 */
function filterByLabel(
  results: PrometheusResultItem[],
  labelConfig: LabelConfig
): PrometheusResultItem[] {
  const { labelName, labelFilter } = labelConfig;
  if (!labelName || !labelFilter) {
    return results;
  }

  return results.filter((r) => {
    const labelValue = r.metric?.[labelName];
    return labelValue === labelFilter;
  });
}

/**
 * Aggregate an array of values
 */
export function aggregate(values: number[], aggregation: AggregationType): number {
  if (values.length === 0) {
    return 0;
  }

  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);

    case 'min':
      return Math.min(...values);

    case 'max':
      return Math.max(...values);

    case 'count':
      return values.length;

    case 'last':
      return values[values.length - 1];

    case 'first':
      return values[0];

    case 'rate': {
      // Calculate rate of change per second (assumes 1s intervals)
      if (values.length < 2) return 0;
      const first = values[0];
      const last = values[values.length - 1];
      return (last - first) / (values.length - 1);
    }

    case 'avg':
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * Test connection to Prometheus
 */
export async function testConnection(endpoint: string, timeout: number): Promise<boolean> {
  try {
    const driver = createPrometheusDriver(endpoint, timeout);
    // Use a simple query that should always work
    await driver.instantQuery('1');
    return true;
  } catch {
    return false;
  }
}
