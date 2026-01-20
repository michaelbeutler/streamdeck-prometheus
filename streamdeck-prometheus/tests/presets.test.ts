/**
 * Tests for query presets
 */

import { queryPresets, getPreset, getPresetKeys, getPresetsByCategory } from '../src/presets';

describe('queryPresets', () => {
  it('should contain memory_usage preset', () => {
    expect(queryPresets.memory_usage).toBeDefined();
    expect(queryPresets.memory_usage.name).toBe('Memory Usage');
    expect(queryPresets.memory_usage.query).toContain('node_memory');
    expect(queryPresets.memory_usage.unit).toBe('%');
    expect(queryPresets.memory_usage.metricType).toBe('instant');
  });

  it('should contain cpu_usage preset', () => {
    expect(queryPresets.cpu_usage).toBeDefined();
    expect(queryPresets.cpu_usage.query).toContain('node_cpu_seconds_total');
    expect(queryPresets.cpu_usage.thresholdConfig).toBeDefined();
    expect(queryPresets.cpu_usage.thresholdConfig?.warning).toBe(70);
    expect(queryPresets.cpu_usage.thresholdConfig?.critical).toBe(90);
  });

  it('should contain disk_usage preset', () => {
    expect(queryPresets.disk_usage).toBeDefined();
    expect(queryPresets.disk_usage.query).toContain('node_filesystem');
  });

  it('should contain http_latency_p95 preset with duration format', () => {
    expect(queryPresets.http_latency_p95).toBeDefined();
    expect(queryPresets.http_latency_p95.formatConfig?.format).toBe('duration');
    expect(queryPresets.http_latency_p95.query).toContain('histogram_quantile');
  });

  it('should contain service_up preset', () => {
    expect(queryPresets.service_up).toBeDefined();
    expect(queryPresets.service_up.query).toBe('up');
  });

  it('should contain range query presets', () => {
    expect(queryPresets.cpu_avg_1h).toBeDefined();
    expect(queryPresets.cpu_avg_1h.metricType).toBe('range');
    expect(queryPresets.cpu_avg_1h.rangeConfig).toBeDefined();
    expect(queryPresets.cpu_avg_1h.rangeConfig?.duration).toBe('1h');
    expect(queryPresets.cpu_avg_1h.rangeConfig?.aggregation).toBe('avg');
  });

  it('should have all required fields in presets', () => {
    for (const [key, preset] of Object.entries(queryPresets)) {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.query).toBeTruthy();
      expect(preset.metricType).toBeTruthy();
      expect(typeof preset.unit).toBe('string');
    }
  });
});

describe('getPreset', () => {
  it('should return preset by key', () => {
    const preset = getPreset('memory_usage');
    expect(preset).toBeDefined();
    expect(preset?.name).toBe('Memory Usage');
  });

  it('should return undefined for unknown key', () => {
    const preset = getPreset('unknown_preset');
    expect(preset).toBeUndefined();
  });
});

describe('getPresetKeys', () => {
  it('should return all preset keys', () => {
    const keys = getPresetKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('memory_usage');
    expect(keys).toContain('cpu_usage');
    expect(keys).toContain('disk_usage');
    expect(keys).toContain('http_latency_p95');
  });
});

describe('getPresetsByCategory', () => {
  it('should group presets by category', () => {
    const categories = getPresetsByCategory();

    expect(categories.System).toBeDefined();
    expect(categories.HTTP).toBeDefined();
    expect(categories.Network).toBeDefined();
    expect(categories.Container).toBeDefined();
  });

  it('should have system presets in System category', () => {
    const categories = getPresetsByCategory();

    const systemPresetNames = categories.System.map((p) => p.name);
    expect(systemPresetNames).toContain('Memory Usage');
    expect(systemPresetNames).toContain('CPU Usage');
    expect(systemPresetNames).toContain('Disk Usage');
  });

  it('should have HTTP presets in HTTP category', () => {
    const categories = getPresetsByCategory();

    const httpPresetNames = categories.HTTP.map((p) => p.name);
    expect(httpPresetNames).toContain('HTTP Request Rate');
    expect(httpPresetNames).toContain('HTTP Error Rate');
    expect(httpPresetNames).toContain('HTTP Latency P95');
  });
});
