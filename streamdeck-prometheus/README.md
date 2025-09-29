# StreamDeck Prometheus Plugin

A StreamDeck plugin that displays Prometheus metrics with automatic refresh capabilities.

## Features

- **Configurable Prometheus Endpoint**: Connect to any Prometheus server by specifying the endpoint URL
- **Custom PromQL Queries**: Write your own Prometheus queries to display any metric
- **Customizable Units**: Add units or suffixes to your displayed values (e.g., °C, MB, %, req/s)
- **Automatic Refresh**: Metrics are automatically updated every 5 seconds
- **Manual Refresh**: Press the StreamDeck key to immediately refresh the metric
- **Error Handling**: Robust error handling with retry mechanisms and clear error states

## Configuration

### Setting up the Plugin

1. Install the plugin on your StreamDeck
2. Add the Prometheus action to any key
3. Right-click the key and select "Edit" to open the property inspector
4. Configure the following settings:

#### Required Settings

- **Prometheus Endpoint**: The URL of your Prometheus server
  - Example: `https://prometheus.example.com:9090/`
  - Must include the protocol (http:// or https://)

- **Prometheus Query (PromQL)**: A valid PromQL query that returns a single numeric value
  - Example: `node_memory_MemAvailable_bytes / 1024 / 1024 / 1024` (Available memory in GB)
  - Example: `up{instance="localhost:9090"}` (Service uptime status)
  - Example: `rate(http_requests_total[5m])` (HTTP request rate)

#### Optional Settings

- **Unit/Suffix**: Optional unit or suffix to display after the metric value
  - Examples: `MB`, `GB`, `°C`, `%`, `req/s`, `ms`

### Example Configurations

#### System Memory Usage
- **Endpoint**: `https://prometheus.example.com:9090/`
- **Query**: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
- **Unit**: `%`

#### CPU Temperature
- **Endpoint**: `https://prometheus.example.com:9090/`
- **Query**: `node_hwmon_temp_celsius{chip="platform_coretemp_0", sensor="temp1"}`
- **Unit**: `°C`

#### HTTP Request Rate
- **Endpoint**: `https://prometheus.example.com:9090/`
- **Query**: `rate(http_requests_total[5m])`
- **Unit**: `req/s`

## Development

### Building the Plugin

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Plugin Behavior

- **Refresh Interval**: The plugin automatically refreshes metrics every 5 seconds
- **Manual Refresh**: Press the StreamDeck key to trigger an immediate refresh
- **Error Handling**: If a query fails, the plugin will retry up to 3 times before showing an error state
- **Settings Persistence**: All settings are saved automatically and persist between StreamDeck restarts
- **Default Values**: If no settings are configured, the plugin uses default values from the config file

## Troubleshooting

### Common Issues

1. **"Error" displayed on key**: 
   - Check that your Prometheus endpoint is accessible
   - Verify your PromQL query syntax is correct
   - Ensure the query returns a single numeric value

2. **"No data returned"**:
   - Your query might not be returning any results
   - Check if the metric exists in your Prometheus instance

3. **Connection issues**:
   - Verify the Prometheus endpoint URL is correct
   - Check if your Prometheus server requires authentication (not currently supported)
   - Ensure there are no network connectivity issues

### Logs

Plugin logs can be found in the StreamDeck application logs directory under:
- macOS: `~/Library/Logs/ElgatoStreamDeck/`
- Windows: `%APPDATA%\Elgato\StreamDeck\logs\`

Look for files named `cloud.iperka.streamdeck-prometheus.*.log`

## License

See LICENSE file for license information.