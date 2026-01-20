# Contributing to Stream Deck Prometheus Plugin

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 9 or higher
- Elgato Stream Deck software (for testing)
- Git

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/streamdeck-prometheus.git
cd streamdeck-prometheus/streamdeck-prometheus
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development mode**

```bash
npm run dev
```

This will watch for changes and automatically rebuild the plugin.

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-histogram-support`
- `fix/timeout-handling`
- `docs/update-readme`

### Code Style

We use ESLint and Prettier for code formatting. Run these before committing:

```bash
# Check for issues
npm run lint
npm run format:check

# Auto-fix issues
npm run lint:fix
npm run format
```

### Type Checking

Ensure TypeScript types are correct:

```bash
npm run typecheck
```

### Testing

Write tests for new features and ensure existing tests pass:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Pre-commit Validation

Before committing, run the full validation suite:

```bash
npm run validate
```

This runs typecheck, lint, and tests.

## Project Structure

```
src/
├── plugin.ts           # Plugin entry point
├── types.ts            # TypeScript type definitions
├── presets.ts          # Query presets configuration
├── config.json         # Default configuration
├── actions/
│   └── prometheus.ts   # Main PrometheusAction class
└── utils/
    ├── index.ts        # Barrel export
    ├── formatting.ts   # Value formatting utilities
    ├── settings.ts     # Settings parsing and validation
    └── prometheus.ts   # Prometheus query utilities
```

### Key Components

- **PrometheusAction** (`src/actions/prometheus.ts`): The main action class that handles StreamDeck events, queries Prometheus, and updates the display.

- **Utilities** (`src/utils/`):
  - `formatting.ts`: Functions for formatting values (numbers, bytes, durations, etc.)
  - `settings.ts`: Settings parsing, validation, and defaults
  - `prometheus.ts`: Prometheus query execution and result handling

- **Types** (`src/types.ts`): TypeScript interfaces for settings, configurations, and Prometheus responses.

- **Presets** (`src/presets.ts`): Pre-defined query configurations for common metrics.

## Adding New Features

### Adding a New Display Format

1. Add the format type to `DisplayFormat` in `src/types.ts`
2. Implement the formatter in `src/utils/formatting.ts`
3. Add the format to `formatByType()` switch statement
4. Add UI option in `prometheus.html`
5. Add tests in `tests/utils/formatting.test.ts`

### Adding a New Preset

1. Add the preset to `queryPresets` in `src/presets.ts`
2. Add preset button in `prometheus.html`
3. Add tests in `tests/presets.test.ts`

### Adding a New Setting

1. Add to `PrometheusSettings` interface in `src/types.ts`
2. Add parsing in `src/utils/settings.ts`
3. Update validation if needed
4. Add UI control in `prometheus.html`
5. Handle in `PrometheusAction` if needed
6. Add tests

## Writing Tests

### Test File Organization

```
tests/
├── setup.ts                    # Jest configuration and mocks
├── presets.test.ts            # Preset tests
├── utils/
│   ├── formatting.test.ts     # Formatting utility tests
│   ├── settings.test.ts       # Settings utility tests
│   └── prometheus.test.ts     # Prometheus utility tests
└── helpers/
    └── test-utils.ts          # Test helper functions
```

### Test Guidelines

- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies
- Test both success and error cases
- Aim for high coverage of critical paths

### Example Test

```typescript
describe('formatBytes', () => {
  it('should format kilobytes', () => {
    expect(formatBytes(1024, 2)).toBe('1.00 KB');
  });

  it('should handle zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});
```

## Submitting Changes

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all tests pass (`npm run validate`)
4. Update documentation if needed
5. Submit a pull request with a clear description

### Pull Request Title

Use conventional commit format:
- `feat: add histogram support`
- `fix: handle network timeout`
- `docs: update configuration guide`
- `refactor: simplify settings parsing`
- `test: add formatting edge cases`

### Pull Request Description

Include:
- What the change does
- Why the change is needed
- How to test the change
- Screenshots for UI changes

## Release Process

Releases are automated via GitHub Actions when a version tag is pushed:

```bash
git tag v0.3.0
git push origin v0.3.0
```

This will:
1. Run CI checks
2. Build the plugin
3. Create a GitHub release with the plugin file

## Getting Help

- Open an issue for bugs or feature requests
- Tag issues with appropriate labels
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
