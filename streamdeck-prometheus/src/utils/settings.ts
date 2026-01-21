/**
 * Settings parsing and validation utilities
 */

import type {
  PrometheusSettings,
  ParsedPrometheusSettings,
  RangeQueryConfig,
  FormatConfig,
  ThresholdConfig,
  LabelConfig,
  MetricType,
  AggregationType,
} from '../types.js';
import config from '../config.json';

/**
 * Default values for settings
 */
const defaults = {
  endpoint: config.prometheus.endpoint || '',
  timeout: config.prometheus.timeout || 10000,
  refreshInterval: config.prometheus.refreshInterval || 5000,
  query: config.defaultQuery || '',
  unit: config.defaultUnit || '',
  metricType: 'instant' as MetricType,
  decimals: 0,
  resultIndex: 0,
  showTrend: false,
  debug: false,
};

/**
 * Parse JSON safely with fallback
 */
function safeJsonParse<T>(json: string | undefined, fallback: T): T {
  if (!json || json.trim() === '') {
    return fallback;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate and parse metric type
 */
function parseMetricType(type: string | undefined): MetricType {
  const validTypes: MetricType[] = ['instant', 'range', 'series'];
  if (type && validTypes.includes(type as MetricType)) {
    return type as MetricType;
  }
  return defaults.metricType;
}

/**
 * Validate aggregation type
 */
function parseAggregationType(type: string | undefined): AggregationType {
  const validTypes: AggregationType[] = [
    'avg',
    'sum',
    'min',
    'max',
    'count',
    'last',
    'first',
    'rate',
  ];
  if (type && validTypes.includes(type as AggregationType)) {
    return type as AggregationType;
  }
  return 'avg';
}

/**
 * Parse range query configuration
 */
function parseRangeConfig(json: string | undefined): RangeQueryConfig | null {
  const parsed = safeJsonParse<Partial<RangeQueryConfig>>(json, {});

  if (!parsed.duration) {
    return null;
  }

  return {
    duration: parsed.duration,
    step: parsed.step,
    aggregation: parseAggregationType(parsed.aggregation),
  };
}

/**
 * Parse format configuration
 */
function parseFormatConfig(json: string | undefined, unit: string | undefined): FormatConfig {
  const parsed = safeJsonParse<Partial<FormatConfig>>(json, {});

  return {
    decimals: typeof parsed.decimals === 'number' ? parsed.decimals : defaults.decimals,
    unit: parsed.unit ?? unit ?? defaults.unit,
    prefix: parsed.prefix,
    format: parsed.format ?? 'number',
    multiplier: parsed.multiplier,
    divisor: parsed.divisor,
  };
}

/**
 * Parse threshold configuration
 */
function parseThresholdConfig(json: string | undefined): ThresholdConfig | null {
  const parsed = safeJsonParse<Partial<ThresholdConfig>>(json, {});

  if (parsed.warning === undefined && parsed.critical === undefined) {
    return null;
  }

  return {
    warning: parsed.warning,
    critical: parsed.critical,
    higherIsBad: parsed.higherIsBad !== false,
  };
}

/**
 * Parse label configuration
 */
function parseLabelConfig(json: string | undefined): LabelConfig {
  const parsed = safeJsonParse<Partial<LabelConfig>>(json, {});

  return {
    labelName: parsed.labelName,
    labelFilter: parsed.labelFilter,
    resultIndex: typeof parsed.resultIndex === 'number' ? parsed.resultIndex : defaults.resultIndex,
  };
}

/**
 * Parse headers from JSON string
 */
function parseHeaders(json: string | undefined): Record<string, string> {
  return safeJsonParse<Record<string, string>>(json, {});
}

/**
 * Parse raw settings into typed settings object
 */
export function parseSettings(settings: PrometheusSettings): ParsedPrometheusSettings {
  return {
    endpoint: settings.endpoint ?? defaults.endpoint,
    timeout:
      typeof settings.timeout === 'number' && settings.timeout > 0
        ? settings.timeout
        : defaults.timeout,
    headers: parseHeaders(settings.headers),
    query: settings.query ?? defaults.query,
    metricType: parseMetricType(settings.metricType),
    rangeConfig: parseRangeConfig(settings.rangeConfig),
    formatConfig: parseFormatConfig(settings.formatConfig, settings.unit),
    thresholdConfig: parseThresholdConfig(settings.thresholdConfig),
    labelConfig: parseLabelConfig(settings.labelConfig),
    refreshInterval:
      typeof settings.refreshInterval === 'number' && settings.refreshInterval > 0
        ? settings.refreshInterval
        : defaults.refreshInterval,
    showTrend: settings.showTrend === true,
    debug: settings.debug === true,
  };
}

/**
 * Validate settings and return validation errors
 */
export function validateSettings(settings: ParsedPrometheusSettings): string[] {
  const errors: string[] = [];

  if (!settings.endpoint) {
    errors.push('Prometheus endpoint is required');
  } else if (!isValidUrl(settings.endpoint)) {
    errors.push('Prometheus endpoint must be a valid HTTP/HTTPS URL');
  }

  if (!settings.query) {
    errors.push('PromQL query is required');
  }

  if (settings.metricType === 'range' && !settings.rangeConfig) {
    errors.push('Range configuration is required for range queries');
  }

  if (settings.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }

  if (settings.refreshInterval < 1000) {
    errors.push('Refresh interval must be at least 1000ms');
  }

  return errors;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Merge partial settings with defaults
 */
export function mergeWithDefaults(
  settings: Partial<PrometheusSettings>
): Partial<PrometheusSettings> {
  return {
    endpoint: settings.endpoint ?? defaults.endpoint,
    timeout: settings.timeout ?? defaults.timeout,
    query: settings.query ?? defaults.query,
    unit: settings.unit ?? defaults.unit,
    metricType: settings.metricType ?? defaults.metricType,
    refreshInterval: settings.refreshInterval ?? defaults.refreshInterval,
    showTrend: settings.showTrend ?? defaults.showTrend,
    debug: settings.debug ?? defaults.debug,
    ...settings,
  };
}
