import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DidReceiveSettingsEvent,
} from '@elgato/streamdeck';
import { PrometheusDriver } from 'prometheus-query';
import config from '../config.json';
import type { PrometheusSettings, ParsedPrometheusSettings } from '../types.js';
import {
  parseSettings,
  validateSettings,
  mergeWithDefaults,
  formatValue,
  getThresholdStatus,
  getTrendIndicator,
  executeQuery,
  createPrometheusDriver,
  type QueryResult,
} from '../utils/index.js';

/**
 * StreamDeck action that displays Prometheus metrics with support for
 * instant queries, range queries, and various display formats.
 */
@action({ UUID: 'cloud.iperka.streamdeck-prometheus.prometheus' })
export class PrometheusAction extends SingletonAction<PrometheusSettings> {
  private intervalId: NodeJS.Timeout | null = null;
  private prometheusDriver: PrometheusDriver | null = null;
  private isQuerying = false;
  private retryCount = 0;
  private maxRetries = config.prometheus.maxRetries;
  private previousValue: number | null = null;
  private parsedSettings: ParsedPrometheusSettings | null = null;

  /**
   * Initialize the action when it becomes visible.
   */
  override onWillAppear(ev: WillAppearEvent<PrometheusSettings>): void {
    try {
      this.cleanup();

      // Parse and validate settings
      const mergedSettings = mergeWithDefaults(ev.payload.settings);
      this.parsedSettings = parseSettings(mergedSettings as PrometheusSettings);

      const validationErrors = validateSettings(this.parsedSettings);
      if (validationErrors.length > 0) {
        this.log('warn', `Validation warnings: ${validationErrors.join(', ')}`);
      }

      // Update settings with merged defaults
      void ev.action.setSettings(mergedSettings);

      // Initialize Prometheus driver
      if (this.parsedSettings.endpoint) {
        this.prometheusDriver = createPrometheusDriver(
          this.parsedSettings.endpoint,
          this.parsedSettings.timeout,
          this.parsedSettings.headers
        );
      }

      // Set initial title
      void ev.action.setTitle(ev.payload.settings.value ?? 'Loading...');

      // Start refresh interval
      const refreshInterval = this.parsedSettings.refreshInterval;
      this.intervalId = setInterval(() => {
        this.reconcile(ev).catch((error: unknown) => {
          this.log('error', 'Error in scheduled reconcile:', error);
        });
      }, refreshInterval);

      // Perform initial query
      this.reconcile(ev).catch((error: unknown) => {
        this.log('error', 'Error in initial reconcile:', error);
      });

      this.log('info', 'PrometheusAction initialized successfully');
    } catch (error: unknown) {
      this.log('error', 'Error in onWillAppear:', error);
      void ev.action.setTitle('Error');
    }
  }

  /**
   * Cleanup when action disappears to prevent memory leaks.
   */
  override onWillDisappear(_ev: WillDisappearEvent<PrometheusSettings>): void {
    this.cleanup();
    this.log('info', 'PrometheusAction cleaned up');
  }

  /**
   * Handle key press for manual refresh.
   */
  override onKeyDown(ev: KeyDownEvent<PrometheusSettings>): void {
    this.log('info', 'Key pressed - triggering manual refresh');
    this.retryCount = 0; // Reset retry count on manual refresh

    this.reconcile(ev as unknown as WillAppearEvent<PrometheusSettings>).catch(
      (error: unknown) => {
        this.log('error', 'Error in manual reconcile:', error);
      }
    );
  }

  /**
   * Handle settings changes.
   */
  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<PrometheusSettings>): void {
    try {
      // Re-parse settings
      this.parsedSettings = parseSettings(ev.payload.settings);

      const validationErrors = validateSettings(this.parsedSettings);
      if (validationErrors.length > 0) {
        this.log('warn', `Validation warnings: ${validationErrors.join(', ')}`);
      }

      this.log('info', 'Settings changed, reinitializing Prometheus driver');

      // Reinitialize Prometheus driver if endpoint changed
      if (this.parsedSettings.endpoint) {
        this.prometheusDriver = createPrometheusDriver(
          this.parsedSettings.endpoint,
          this.parsedSettings.timeout,
          this.parsedSettings.headers
        );
      }

      // Reset retry count and trigger refresh
      this.retryCount = 0;
      this.reconcile(ev as unknown as WillAppearEvent<PrometheusSettings>).catch(
        (error: unknown) => {
          this.log('error', 'Error in settings change reconcile:', error);
        }
      );
    } catch (error: unknown) {
      this.log('error', 'Error handling settings change:', error);
      void ev.action.setTitle('Error');
    }
  }

  /**
   * Fetch and update Prometheus metrics.
   */
  private async reconcile(ev: WillAppearEvent<PrometheusSettings>): Promise<void> {
    if (this.isQuerying) {
      this.log('debug', 'Query already in progress, skipping');
      return;
    }

    this.isQuerying = true;

    try {
      this.log('debug', 'Starting Prometheus query');

      if (!this.prometheusDriver) {
        throw new Error('Prometheus driver not initialized');
      }

      if (!this.parsedSettings) {
        throw new Error('Settings not parsed');
      }

      if (!this.parsedSettings.query) {
        throw new Error('No Prometheus query configured');
      }

      if (!this.parsedSettings.endpoint) {
        throw new Error('No Prometheus endpoint configured');
      }

      // Execute query based on metric type
      const result: QueryResult = await executeQuery(this.prometheusDriver, this.parsedSettings);

      // Format the value for display
      const formattedValue = this.formatDisplayValue(result.value, this.parsedSettings);

      // Update settings with new value
      await ev.action.setSettings({
        value: formattedValue,
        lastUpdate: new Date().toISOString(),
        lastError: undefined,
      });

      // Update display
      await ev.action.setTitle(formattedValue);

      // Store current value for trend calculation
      this.previousValue = result.value;

      // Reset retry count on success
      this.retryCount = 0;

      this.log('info', `Successfully updated metric: ${formattedValue}`);
    } catch (error: unknown) {
      this.retryCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(
        'error',
        `Prometheus query failed (attempt ${this.retryCount}/${this.maxRetries}): ${errorMessage}`
      );

      // Update error state in settings
      await ev.action.setSettings({
        lastError: errorMessage,
      });

      // Show error state after max retries
      if (this.retryCount >= this.maxRetries) {
        await ev.action.setTitle('Error');
        this.log('error', 'Max retries reached, showing error state');
      } else {
        await ev.action.setTitle(`Retry ${this.retryCount}`);
      }
    } finally {
      this.isQuerying = false;
    }
  }

  /**
   * Format value for display on Stream Deck key.
   */
  private formatDisplayValue(value: number, settings: ParsedPrometheusSettings): string {
    try {
      // Format the value according to settings
      let formattedValue = formatValue(value, settings.formatConfig);

      // Add trend indicator if enabled
      if (settings.showTrend) {
        const trend = getTrendIndicator(value, this.previousValue);
        if (trend) {
          formattedValue = `${trend}${formattedValue}`;
        }
      }

      // Add threshold status indicator
      const thresholdStatus = getThresholdStatus(value, settings.thresholdConfig);
      if (thresholdStatus === 'critical') {
        formattedValue = `!${formattedValue}`;
      } else if (thresholdStatus === 'warning') {
        formattedValue = `~${formattedValue}`;
      }

      return formattedValue;
    } catch (error: unknown) {
      this.log('error', 'Error formatting value:', error);
      return 'Error';
    }
  }

  /**
   * Clean up resources.
   */
  private cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.prometheusDriver = null;
    this.isQuerying = false;
    this.retryCount = 0;
    this.previousValue = null;
    this.parsedSettings = null;
  }

  /**
   * Log helper with debug mode support.
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, error?: unknown): void {
    const logMessage = error ? `${message} ${String(error)}` : message;

    switch (level) {
      case 'debug':
        if (this.parsedSettings?.debug) {
          streamDeck.logger.debug(logMessage);
        }
        break;
      case 'info':
        streamDeck.logger.info(logMessage);
        break;
      case 'warn':
        streamDeck.logger.warn(logMessage);
        break;
      case 'error':
        streamDeck.logger.error(logMessage);
        break;
    }
  }
}
