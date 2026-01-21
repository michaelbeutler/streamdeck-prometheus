# Stream Deck Prometheus Plugin

[![CI](https://github.com/michaelbeutler/streamdeck-prometheus/actions/workflows/ci.yml/badge.svg)](https://github.com/michaelbeutler/streamdeck-prometheus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Display Prometheus metrics on your Elgato Stream Deck with real-time updates, customizable formatting, and threshold-based alerts.

## Features

- **Multiple Query Types**: Support for instant queries, range queries with aggregation, and series queries with label filtering
- **Rich Display Formats**: Numbers, percentages, bytes (auto-scaled), durations, and scientific notation
- **Threshold Alerts**: Warning and critical thresholds with visual indicators (`~` for warning, `!` for critical)
- **Trend Indicators**: Show value trends with up/down/stable arrows
- **Quick Presets**: Pre-configured queries for common metrics (CPU, memory, disk, HTTP, Kubernetes)
- **Customizable Refresh**: Configure refresh intervals and timeouts
- **Error Handling**: Automatic retries with graceful error states
- **Debug Mode**: Optional debug logging for troubleshooting

## Installation

1. Download the latest release from the [Releases](https://github.com/michaelbeutler/streamdeck-prometheus/releases) page
2. Double-click the `.streamDeckPlugin` file to install
3. The plugin will appear in the Stream Deck software under the "Prometheus" category

## Configuration

### Connection Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Endpoint** | Your Prometheus server URL (e.g., `https://prometheus.example.com:9090`) | Required |
| **Timeout** | Request timeout in milliseconds | 10000 |
| **Refresh Interval** | How often to fetch new data in milliseconds | 5000 |

### Query Settings

| Setting | Description |
|---------|-------------|
| **Metric Type** | `instant` (current value), `range` (aggregated over time), or `series` (with label filtering) |
| **PromQL Query** | Your Prometheus query |
| **Range Duration** | For range queries: how far back to look (e.g., `5m`, `1h`, `24h`) |
| **Aggregation** | For range queries: `avg`, `sum`, `min`, `max`, `count`, `first`, `last`, `rate` |

### Display Settings

| Setting | Description |
|---------|-------------|
| **Format** | `number`, `percentage`, `bytes`, `duration`, or `scientific` |
| **Decimals** | Number of decimal places (0-3) |
| **Unit/Suffix** | Text to append to value (e.g., `%`, `MB`, `/s`) |
| **Prefix** | Text to prepend to value |
| **Multiplier/Divisor** | Math operations to apply to raw value |
| **Show Trend** | Display trend indicator (arrows) |

### Thresholds

| Setting | Description |
|---------|-------------|
| **Warning** | Value that triggers warning state (`~` prefix) |
| **Critical** | Value that triggers critical state (`!` prefix) |
| **Higher is Bad** | Whether higher values indicate problems |

## Quick Presets

Click preset buttons in the UI to quickly configure common metrics:

### System Metrics
- **Memory %**: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
- **CPU %**: `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
- **Disk %**: `(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100`
- **Load 1m**: `node_load1`

### HTTP Metrics
- **Req/s**: `sum(rate(http_requests_total[5m]))`
- **Errors %**: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
- **P95 Latency**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`

### Service Metrics
- **Up Status**: `up` (1 = up, 0 = down)
- **Container CPU**: `sum(rate(container_cpu_usage_seconds_total[5m])) by (container) * 100`
- **Pod Restarts**: `sum(kube_pod_container_status_restarts_total) by (pod)`

## Development

### Prerequisites

- Node.js 20+
- npm 9+
- Elgato Stream Deck software

### Setup

```bash
cd streamdeck-prometheus

# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode with auto-reload
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build for production |
| `npm run dev` | Development mode with watch |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run validate` | Run all checks (typecheck, lint, test) |

### Project Structure

```
streamdeck-prometheus/
├── src/
│   ├── plugin.ts              # Plugin entry point
│   ├── types.ts               # TypeScript types
│   ├── presets.ts             # Query presets
│   ├── config.json            # Default configuration
│   ├── actions/
│   │   └── prometheus.ts      # Main action class
│   └── utils/
│       ├── index.ts           # Utils barrel export
│       ├── formatting.ts      # Value formatting utilities
│       ├── settings.ts        # Settings parsing/validation
│       └── prometheus.ts      # Prometheus query utilities
├── tests/
│   ├── setup.ts               # Jest setup
│   ├── presets.test.ts        # Presets tests
│   ├── utils/                 # Utility tests
│   └── helpers/               # Test helpers
├── cloud.iperka.streamdeck-prometheus.sdPlugin/
│   ├── manifest.json          # Plugin manifest
│   ├── ui/
│   │   └── prometheus.html    # Property Inspector UI
│   └── imgs/                  # Plugin icons
└── package.json
```

## Troubleshooting

### Common Issues

**"Error" displayed on key**
- Check that your Prometheus endpoint is accessible
- Verify your PromQL query is valid
- Check the Stream Deck logs for detailed error messages

**No data displayed**
- Ensure your query returns data
- Try the query in Prometheus UI first
- Check for CORS issues if using a proxy

**Values seem wrong**
- Verify the multiplier/divisor settings
- Check the display format matches your data type
- Ensure thresholds are configured correctly

### Debug Mode

Enable debug logging in the Advanced section to see detailed logs:

1. Open the action settings
2. Expand the "Advanced" section
3. Check "Enable debug logging"
4. View logs in:
   - **macOS**: `~/Library/Logs/ElgatoStreamDeck/`
   - **Windows**: `%appdata%\Elgato\StreamDeck\logs\`

Look for files named `cloud.iperka.streamdeck-prometheus.*.log`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Acknowledgments

- [Elgato Stream Deck SDK](https://developer.elgato.com/documentation/stream-deck/sdk/overview/)
- [prometheus-query](https://www.npmjs.com/package/prometheus-query) for Prometheus client
