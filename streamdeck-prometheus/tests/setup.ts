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
  action: jest.fn().mockImplementation(() => (target: unknown) => target),
  SingletonAction: class MockSingletonAction {
    onWillAppear = jest.fn();
    onWillDisappear = jest.fn();
    onKeyDown = jest.fn();
    onDidReceiveSettings = jest.fn();
  },
}));

// Mock prometheus-query
jest.mock('prometheus-query', () => ({
  PrometheusDriver: jest.fn().mockImplementation(() => ({
    instantQuery: jest.fn(),
    rangeQuery: jest.fn(),
  })),
}));

// Store original timers
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

// Create mock timer functions
const mockSetInterval = jest.fn((callback: () => void, ms: number) => {
  return originalSetInterval(callback, ms);
});
const mockClearInterval = jest.fn((id: NodeJS.Timeout | null) => {
  if (id) {
    originalClearInterval(id);
  }
});

// Apply mocks
global.setInterval = mockSetInterval as unknown as typeof setInterval;
global.clearInterval = mockClearInterval as unknown as typeof clearInterval;

// Setup global test timeout
jest.setTimeout(10000);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  global.setInterval = originalSetInterval;
  global.clearInterval = originalClearInterval;
});

export { mockSetInterval, mockClearInterval };
