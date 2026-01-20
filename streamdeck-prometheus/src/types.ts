/**
 * Types for StreamDeck Prometheus Plugin
 */

/**
 * Supported metric query types
 */
export type MetricType = 'instant' | 'range' | 'series';

/**
 * Aggregation functions for range queries
 */
export type AggregationType = 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last' | 'first' | 'rate';

/**
 * Display format for the metric value
 */
export type DisplayFormat = 'number' | 'percentage' | 'bytes' | 'duration' | 'scientific';

/**
 * Threshold configuration for visual feedback
 */
export interface ThresholdConfig {
  /** Warning threshold - displays amber/yellow when exceeded */
  warning?: number;
  /** Critical threshold - displays red when exceeded */
  critical?: number;
  /** Whether higher values are bad (default: true). Set to false if lower values are concerning */
  higherIsBad?: boolean;
}

/**
 * Range query configuration
 */
export interface RangeQueryConfig {
  /** Duration to look back (e.g., '5m', '1h', '24h') */
  duration: string;
  /** Step interval for the range query (e.g., '15s', '1m') */
  step?: string;
  /** Aggregation function to apply to range results */
  aggregation: AggregationType;
}

/**
 * Value formatting configuration
 */
export interface FormatConfig {
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Unit/suffix to display after value */
  unit?: string;
  /** Prefix to display before value */
  prefix?: string;
  /** Display format type */
  format?: DisplayFormat;
  /** Multiplier to apply to raw value (e.g., 0.001 for bytes to KB) */
  multiplier?: number;
  /** Divisor to apply to raw value */
  divisor?: number;
}

/**
 * Label extraction configuration for series queries
 */
export interface LabelConfig {
  /** Label to extract from the metric */
  labelName?: string;
  /** Filter by specific label value */
  labelFilter?: string;
  /** Index of result to use (default: 0) */
  resultIndex?: number;
}

/**
 * Complete settings for Prometheus action
 */
export interface PrometheusSettings {
  /** Index signature for JsonObject compatibility */
  [key: string]: string | number | boolean | undefined;

  /** Current display value (read-only) */
  value?: string;
  /** Last update timestamp (ISO string) */
  lastUpdate?: string;
  /** Last error message if any */
  lastError?: string;

  // Connection settings
  /** Prometheus server endpoint URL */
  endpoint?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers for authentication (JSON string) */
  headers?: string;

  // Query settings
  /** PromQL query to execute */
  query?: string;
  /** Type of metric query */
  metricType?: MetricType;
  /** Range query configuration (JSON string) */
  rangeConfig?: string;

  // Display settings
  /** Unit/suffix to display */
  unit?: string;
  /** Display format configuration (JSON string) */
  formatConfig?: string;
  /** Threshold configuration (JSON string) */
  thresholdConfig?: string;
  /** Label extraction configuration (JSON string) */
  labelConfig?: string;

  // Behavior settings
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Show trend indicator (up/down arrow) */
  showTrend?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Parsed settings with proper types (for internal use)
 */
export interface ParsedPrometheusSettings {
  endpoint: string;
  timeout: number;
  headers: Record<string, string>;
  query: string;
  metricType: MetricType;
  rangeConfig: RangeQueryConfig | null;
  formatConfig: FormatConfig;
  thresholdConfig: ThresholdConfig | null;
  labelConfig: LabelConfig;
  refreshInterval: number;
  showTrend: boolean;
  debug: boolean;
}

/**
 * Prometheus query result types
 */
export interface PrometheusValue {
  time: Date;
  value: number;
}

export interface PrometheusMetric {
  metric: Record<string, string>;
  value?: PrometheusValue;
  values?: PrometheusValue[];
}

export interface PrometheusResult {
  resultType: 'vector' | 'matrix' | 'scalar' | 'string';
  result: PrometheusMetric[];
}

/**
 * Configuration file structure
 */
export interface PluginConfig {
  prometheus: {
    endpoint: string;
    timeout: number;
    refreshInterval: number;
    maxRetries: number;
  };
  defaultQuery: string;
  defaultUnit: string;
}

/**
 * Preset query definition
 */
export interface QueryPreset {
  name: string;
  description: string;
  query: string;
  unit: string;
  metricType: MetricType;
  rangeConfig?: RangeQueryConfig;
  formatConfig?: FormatConfig;
  thresholdConfig?: ThresholdConfig;
}
