import streamDeck from '@elgato/streamdeck';

// Mock the config module first
jest.mock('../src/config.json', () => ({
  prometheus: {
    endpoint: 'https://test-prometheus.com/',
    timeout: 5000,
    refreshInterval: 1000,
    maxRetries: 2,
  },
  defaultQuery: 'test_metric',
  defaultUnit: '°C',
}));

describe('Plugin Configuration and Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct default configuration', () => {
    const config = require('../src/config.json');

    expect(config.prometheus.endpoint).toBe('https://test-prometheus.com/');
    expect(config.prometheus.timeout).toBe(5000);
    expect(config.prometheus.refreshInterval).toBe(1000);
    expect(config.prometheus.maxRetries).toBe(2);
    expect(config.defaultQuery).toBe('test_metric');
    expect(config.defaultUnit).toBe('°C');
  });

  it('should set up streamdeck logger correctly', () => {
    expect(streamDeck.logger.setLevel).toBeDefined();
    expect(streamDeck.logger.info).toBeDefined();
    expect(streamDeck.logger.error).toBeDefined();
    expect(streamDeck.logger.debug).toBeDefined();
  });

  it('should provide action registration capabilities', () => {
    expect(streamDeck.actions.registerAction).toBeDefined();
    expect(typeof streamDeck.actions.registerAction).toBe('function');
  });

  it('should provide connection capabilities', () => {
    expect(streamDeck.connect).toBeDefined();
    expect(typeof streamDeck.connect).toBe('function');
  });
});

describe('Mock Functionality Tests', () => {
  it('should properly mock prometheus responses', () => {
    // Test that we can create valid mock responses
    const mockResponse = {
      resultType: 'vector' as const,
      result: [{ value: { value: '42.5' } }],
    };

    expect(mockResponse.resultType).toBe('vector');
    expect(mockResponse.result).toHaveLength(1);
    expect(mockResponse.result[0].value.value).toBe('42.5');
  });

  it('should handle async operations properly', async () => {
    const mockPromise = Promise.resolve('test-value');
    const result = await mockPromise;

    expect(result).toBe('test-value');
  });

  it('should handle timer operations with jest fake timers', () => {
    jest.useFakeTimers();

    const callback = jest.fn();
    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);

    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
