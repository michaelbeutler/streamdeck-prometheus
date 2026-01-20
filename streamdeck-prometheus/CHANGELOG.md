# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-20

### Added

- **Multiple Query Types**: Support for instant queries, range queries with aggregation, and series queries with label filtering
- **Display Formats**: New formatting options including bytes (auto-scaled), duration, percentage, and scientific notation
- **Threshold Alerts**: Warning and critical thresholds with visual indicators (`~` for warning, `!` for critical)
- **Trend Indicators**: Optional up/down/stable arrows showing value changes
- **Range Query Aggregation**: Support for avg, sum, min, max, count, first, last, and rate aggregations
- **Label Filtering**: Filter results by specific label values
- **Custom Headers**: Support for custom HTTP headers (authentication)
- **Debug Mode**: Optional debug logging for troubleshooting
- **Comprehensive Presets**: Pre-configured queries for system, HTTP, container, and database metrics

### Changed

- **Completely Redesigned UI**: Collapsible sections, better organization, and more options
- **Improved Settings Structure**: JSON-based configurations for complex settings
- **Enhanced Error Handling**: Better error messages and retry behavior
- **Updated Dependencies**: All dependencies updated to latest versions

### Developer Experience

- **GitHub Actions CI/CD**: Automated linting, testing, building, and releases
- **ESLint + Prettier**: Code quality and formatting enforcement
- **Husky Pre-commit Hooks**: Automatic linting and formatting on commit
- **Comprehensive Test Suite**: Unit tests for all utilities and components
- **TypeScript Strict Mode**: Improved type safety

## [0.2.0] - 2025-01-15

### Added

- Enhanced UI with modern dark theme
- Quick preset buttons for common queries
- Connection status indicator
- Real-time input validation
- Configurable timeout and refresh interval

### Changed

- Improved settings UI layout
- Better error handling and retry logic
- Updated to Node.js 20

### Fixed

- Memory leak in interval cleanup
- Settings persistence issues

## [0.1.0] - 2025-01-01

### Added

- Initial release
- Basic Prometheus instant query support
- Configurable endpoint and query
- Unit/suffix support
- Automatic refresh every 5 seconds
- Manual refresh on key press
- Retry mechanism for failed queries
