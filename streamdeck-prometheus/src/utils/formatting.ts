/**
 * Formatting utilities for Prometheus metric values
 */

import type { DisplayFormat, FormatConfig, ThresholdConfig } from '../types.js';

/**
 * Format a numeric value according to the display format
 */
export function formatValue(value: number, config: FormatConfig): string {
  // Apply multiplier or divisor
  let adjustedValue = value;
  if (config.multiplier !== undefined) {
    adjustedValue *= config.multiplier;
  }
  if (config.divisor !== undefined && config.divisor !== 0) {
    adjustedValue /= config.divisor;
  }

  // Format based on type
  const formatted = formatByType(adjustedValue, config.format ?? 'number', config.decimals ?? 0);

  // Add prefix and unit
  const prefix = config.prefix ?? '';
  const unit = config.unit ?? '';

  return `${prefix}${formatted}${unit}`;
}

/**
 * Format value based on display format type
 */
function formatByType(value: number, format: DisplayFormat, decimals: number): string {
  switch (format) {
    case 'percentage':
      return formatPercentage(value, decimals);
    case 'bytes':
      return formatBytes(value, decimals);
    case 'duration':
      return formatDuration(value);
    case 'scientific':
      return formatScientific(value, decimals);
    case 'number':
    default:
      return formatNumber(value, decimals);
  }
}

/**
 * Format a number with thousands separators and decimals
 */
export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) {
    return 'N/A';
  }

  // Handle very large or very small numbers
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }

  return value.toFixed(decimals);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (!isFinite(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!isFinite(bytes) || bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const size = sizes[Math.min(i, sizes.length - 1)];

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${size}`;
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) {
    return 'N/A';
  }

  const absSeconds = Math.abs(seconds);
  const sign = seconds < 0 ? '-' : '';

  if (absSeconds < 1) {
    return `${sign}${Math.round(absSeconds * 1000)}ms`;
  }
  if (absSeconds < 60) {
    return `${sign}${absSeconds.toFixed(1)}s`;
  }
  if (absSeconds < 3600) {
    const mins = Math.floor(absSeconds / 60);
    const secs = Math.round(absSeconds % 60);
    return `${sign}${mins}m${secs}s`;
  }
  if (absSeconds < 86400) {
    const hours = Math.floor(absSeconds / 3600);
    const mins = Math.round((absSeconds % 3600) / 60);
    return `${sign}${hours}h${mins}m`;
  }

  const days = Math.floor(absSeconds / 86400);
  const hours = Math.round((absSeconds % 86400) / 3600);
  return `${sign}${days}d${hours}h`;
}

/**
 * Format in scientific notation
 */
export function formatScientific(value: number, decimals = 2): string {
  if (!isFinite(value)) {
    return 'N/A';
  }
  return value.toExponential(decimals);
}

/**
 * Determine the threshold status for a value
 */
export function getThresholdStatus(
  value: number,
  config: ThresholdConfig | null
): 'normal' | 'warning' | 'critical' {
  if (!config) {
    return 'normal';
  }

  const higherIsBad = config.higherIsBad !== false;

  if (config.critical !== undefined) {
    if ((higherIsBad && value >= config.critical) || (!higherIsBad && value <= config.critical)) {
      return 'critical';
    }
  }

  if (config.warning !== undefined) {
    if ((higherIsBad && value >= config.warning) || (!higherIsBad && value <= config.warning)) {
      return 'warning';
    }
  }

  return 'normal';
}

/**
 * Calculate trend indicator from current and previous value
 */
export function getTrendIndicator(current: number, previous: number | null): string {
  if (previous === null || !isFinite(current) || !isFinite(previous)) {
    return '';
  }

  const diff = current - previous;
  const threshold = Math.abs(previous) * 0.01; // 1% change threshold

  if (Math.abs(diff) < threshold) {
    return '→';
  }
  return diff > 0 ? '↑' : '↓';
}

/**
 * Parse a duration string (e.g., '5m', '1h', '24h') to seconds
 */
export function parseDuration(duration: string): number {
  const match = /^(\d+(?:\.\d+)?)(s|m|h|d|w|y)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    y: 31536000,
  };

  return value * multipliers[unit];
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
