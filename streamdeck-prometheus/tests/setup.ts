/**
 * Jest setup file for Stream Deck Prometheus Plugin tests
 */

// Mock the Stream Deck module
jest.mock('@elgato/streamdeck', () => ({
  __esModule: true,
  default: {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      setLevel: jest.fn(),
    },
    actions: {
      registerAction: jest.fn(),
    },
    connect: jest.fn().mockResolvedValue(undefined),
  },
  LogLevel: {
    INFO: 'info',
    DEBUG: 'debug',
    ERROR: 'error',
    WARN: 'warn',
  },
  action: jest.fn().mockImplementation((config) => (target: any) => target),
  SingletonAction: class MockSingletonAction {
    onWillAppear = jest.fn();
    onWillDisappear = jest.fn();
    onKeyDown = jest.fn();
  },
}));

// Mock prometheus-query
jest.mock('prometheus-query', () => ({
  PrometheusDriver: jest.fn().mockImplementation(() => ({
    instantQuery: jest.fn(),
  })),
}));

// Mock Node.js globals
(global as any).setInterval = jest.fn();
(global as any).clearInterval = jest.fn();

// Setup global test timeout
jest.setTimeout(10000);