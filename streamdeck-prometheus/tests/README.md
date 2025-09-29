# Testing Setup for Stream Deck Prometheus Plugin

This project includes comprehensive unit and integration tests using Jest and TypeScript.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## 📁 Test Structure

```
tests/
├── README.md                # Testing documentation
├── setup.ts                # Jest setup and global mocks
├── basic.test.ts           # Basic Jest functionality tests
├── working-example.test.ts # Working example tests with mocks
└── helpers/
    └── test-utils.ts       # Test utility functions
```

## Test Coverage

The tests cover:

### Basic Functionality
- ✅ Jest test runner setup and configuration
- ✅ TypeScript compilation and execution
- ✅ Mock functionality validation

### Configuration & Setup
- ✅ Plugin configuration validation
- ✅ StreamDeck SDK mock setup
- ✅ Prometheus mock setup
- ✅ Logger functionality
- ✅ Async operations handling
- ✅ Timer operations with Jest fake timers

## Mock Strategy

The tests use comprehensive mocking for:

- **@elgato/streamdeck**: Mocked to simulate StreamDeck API interactions
- **prometheus-query**: Mocked to simulate Prometheus server responses
- **Node.js timers**: Using Jest fake timers for controlled timing tests
- **Config**: Mocked to provide predictable test configuration

## Key Testing Patterns

### 1. Lifecycle Testing
Tests verify proper resource management through the complete action lifecycle:
```typescript
await prometheusAction.onWillAppear(mockEvent);
// ... verify initialization
await prometheusAction.onWillDisappear(mockEvent);
// ... verify cleanup
```

### 2. Error Recovery Testing
Tests simulate various failure scenarios and verify recovery:
```typescript
mockPrometheusDriver.instantQuery.mockRejectedValue(new Error('Network error'));
// ... trigger retry logic
mockPrometheusDriver.instantQuery.mockResolvedValue(validResponse);
// ... verify recovery
```

### 3. Timer-based Testing
Uses Jest fake timers to test periodic updates:
```typescript
jest.useFakeTimers();
// ... trigger action
jest.advanceTimersByTime(1000);
// ... verify periodic behavior
```

## Best Practices

1. **Isolated Tests**: Each test is independent and doesn't rely on other tests
2. **Comprehensive Mocking**: All external dependencies are mocked
3. **Error Scenarios**: Tests cover both success and failure paths
4. **Resource Cleanup**: Tests verify proper cleanup to prevent memory leaks
5. **Async Handling**: Proper handling of promises and async operations

## Continuous Integration

The test suite is designed to run in CI environments with:
- No external dependencies
- Deterministic timing using fake timers
- Comprehensive coverage reporting
- Fast execution times

## Contributing

When adding new features:

1. Add unit tests for new functions/methods
2. Add integration tests for new workflows
3. Ensure test coverage remains above 90%
4. Follow the existing testing patterns
5. Update this README if adding new test categories