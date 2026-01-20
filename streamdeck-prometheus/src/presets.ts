/**
 * Predefined query presets for common metrics
 */

import type { QueryPreset } from './types.js';

/**
 * Common query presets for Prometheus metrics
 */
export const queryPresets: Record<string, QueryPreset> = {
  // System Metrics
  memory_usage: {
    name: 'Memory Usage',
    description: 'System memory usage percentage',
    query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
    unit: '%',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
    thresholdConfig: {
      warning: 75,
      critical: 90,
      higherIsBad: true,
    },
  },

  memory_available: {
    name: 'Available Memory',
    description: 'Available system memory in human-readable format',
    query: 'node_memory_MemAvailable_bytes',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'bytes',
    },
    thresholdConfig: {
      warning: 2147483648, // 2GB
      critical: 1073741824, // 1GB
      higherIsBad: false,
    },
  },

  cpu_usage: {
    name: 'CPU Usage',
    description: 'Average CPU usage percentage across all cores',
    query: '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    unit: '%',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
    thresholdConfig: {
      warning: 70,
      critical: 90,
      higherIsBad: true,
    },
  },

  cpu_load_1m: {
    name: 'CPU Load (1m)',
    description: '1-minute load average',
    query: 'node_load1',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 2,
      format: 'number',
    },
  },

  cpu_load_5m: {
    name: 'CPU Load (5m)',
    description: '5-minute load average',
    query: 'node_load5',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 2,
      format: 'number',
    },
  },

  disk_usage: {
    name: 'Disk Usage',
    description: 'Root filesystem usage percentage',
    query: '(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100',
    unit: '%',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
    thresholdConfig: {
      warning: 80,
      critical: 95,
      higherIsBad: true,
    },
  },

  disk_available: {
    name: 'Disk Available',
    description: 'Available disk space on root filesystem',
    query: 'node_filesystem_avail_bytes{mountpoint="/"}',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'bytes',
    },
  },

  // Network Metrics
  network_receive_rate: {
    name: 'Network RX Rate',
    description: 'Network receive rate',
    query: 'rate(node_network_receive_bytes_total{device!="lo"}[5m])',
    unit: '/s',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'bytes',
    },
  },

  network_transmit_rate: {
    name: 'Network TX Rate',
    description: 'Network transmit rate',
    query: 'rate(node_network_transmit_bytes_total{device!="lo"}[5m])',
    unit: '/s',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'bytes',
    },
  },

  // Service Health
  service_up: {
    name: 'Service Up',
    description: 'Check if a service is up (1 = up, 0 = down)',
    query: 'up',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'number',
    },
    thresholdConfig: {
      critical: 0,
      higherIsBad: false,
    },
  },

  // HTTP Metrics
  http_requests_rate: {
    name: 'HTTP Request Rate',
    description: 'HTTP requests per second',
    query: 'sum(rate(http_requests_total[5m]))',
    unit: ' req/s',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'number',
    },
  },

  http_error_rate: {
    name: 'HTTP Error Rate',
    description: 'Percentage of HTTP 5xx errors',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100',
    unit: '%',
    metricType: 'instant',
    formatConfig: {
      decimals: 2,
      format: 'percentage',
    },
    thresholdConfig: {
      warning: 1,
      critical: 5,
      higherIsBad: true,
    },
  },

  http_latency_p50: {
    name: 'HTTP Latency P50',
    description: 'Median HTTP response latency',
    query: 'histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'duration',
    },
  },

  http_latency_p95: {
    name: 'HTTP Latency P95',
    description: '95th percentile HTTP response latency',
    query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'duration',
    },
    thresholdConfig: {
      warning: 0.5,
      critical: 1,
      higherIsBad: true,
    },
  },

  http_latency_p99: {
    name: 'HTTP Latency P99',
    description: '99th percentile HTTP response latency',
    query: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'duration',
    },
  },

  // Container/Kubernetes Metrics
  container_cpu_usage: {
    name: 'Container CPU',
    description: 'Container CPU usage percentage',
    query: 'sum(rate(container_cpu_usage_seconds_total[5m])) by (container) * 100',
    unit: '%',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
  },

  container_memory_usage: {
    name: 'Container Memory',
    description: 'Container memory usage',
    query: 'container_memory_usage_bytes',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'bytes',
    },
  },

  pod_restarts: {
    name: 'Pod Restarts',
    description: 'Number of pod restarts',
    query: 'sum(kube_pod_container_status_restarts_total) by (pod)',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'number',
    },
    thresholdConfig: {
      warning: 3,
      critical: 10,
      higherIsBad: true,
    },
  },

  // Database Metrics
  db_connections: {
    name: 'DB Connections',
    description: 'Active database connections',
    query: 'pg_stat_activity_count{state="active"}',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'number',
    },
  },

  db_query_time: {
    name: 'DB Query Time',
    description: 'Average database query time',
    query: 'rate(pg_stat_statements_mean_time_sum[5m]) / rate(pg_stat_statements_calls_sum[5m])',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'duration',
      multiplier: 0.001, // Convert to seconds
    },
  },

  // Queue Metrics
  queue_depth: {
    name: 'Queue Depth',
    description: 'Number of messages in queue',
    query: 'rabbitmq_queue_messages_ready',
    unit: '',
    metricType: 'instant',
    formatConfig: {
      decimals: 0,
      format: 'number',
    },
    thresholdConfig: {
      warning: 1000,
      critical: 10000,
      higherIsBad: true,
    },
  },

  // Custom Range Query Examples
  cpu_avg_1h: {
    name: 'CPU Avg (1h)',
    description: 'Average CPU usage over the last hour',
    query: '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    unit: '%',
    metricType: 'range',
    rangeConfig: {
      duration: '1h',
      aggregation: 'avg',
    },
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
  },

  memory_max_24h: {
    name: 'Memory Max (24h)',
    description: 'Maximum memory usage in the last 24 hours',
    query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
    unit: '%',
    metricType: 'range',
    rangeConfig: {
      duration: '24h',
      aggregation: 'max',
    },
    formatConfig: {
      decimals: 1,
      format: 'percentage',
    },
  },

  // Temperature (for servers with sensors)
  temperature: {
    name: 'Temperature',
    description: 'System temperature from sensors',
    query: 'node_hwmon_temp_celsius',
    unit: '°C',
    metricType: 'instant',
    formatConfig: {
      decimals: 1,
      format: 'number',
    },
    thresholdConfig: {
      warning: 70,
      critical: 85,
      higherIsBad: true,
    },
  },
};

/**
 * Get preset by key
 */
export function getPreset(key: string): QueryPreset | undefined {
  return queryPresets[key];
}

/**
 * Get all preset keys
 */
export function getPresetKeys(): string[] {
  return Object.keys(queryPresets);
}

/**
 * Get presets grouped by category
 */
export function getPresetsByCategory(): Record<string, QueryPreset[]> {
  const categories: Record<string, QueryPreset[]> = {
    System: [],
    Network: [],
    HTTP: [],
    Container: [],
    Database: [],
    Queue: [],
    Custom: [],
  };

  for (const [key, preset] of Object.entries(queryPresets)) {
    if (key.startsWith('memory_') || key.startsWith('cpu_') || key.startsWith('disk_') || key === 'temperature') {
      categories.System.push(preset);
    } else if (key.startsWith('network_')) {
      categories.Network.push(preset);
    } else if (key.startsWith('http_')) {
      categories.HTTP.push(preset);
    } else if (key.startsWith('container_') || key.startsWith('pod_')) {
      categories.Container.push(preset);
    } else if (key.startsWith('db_')) {
      categories.Database.push(preset);
    } else if (key.startsWith('queue_')) {
      categories.Queue.push(preset);
    } else {
      categories.Custom.push(preset);
    }
  }

  return categories;
}
