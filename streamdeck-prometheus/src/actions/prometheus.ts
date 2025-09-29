import streamDeck, {
  action,
  JsonObject,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { PrometheusDriver } from "prometheus-query";
import config from "../config.json";

/**
 * A StreamDeck action that displays Prometheus metrics with automatic refresh.
 */
@action({ UUID: "cloud.iperka.streamdeck-prometheus.prometheus" })
export class PrometheusAction extends SingletonAction<PrometheusSettings> {
  private intervalId: NodeJS.Timeout | null = null;
  private prometheusDriver: PrometheusDriver | null = null;
  private isQuerying = false;
  private retryCount = 0;
  private maxRetries = config.prometheus.maxRetries;

  /**
   * Initialize the action when it becomes visible.
   */
  override onWillAppear(
    ev: WillAppearEvent<PrometheusSettings>
  ): void | Promise<void> {
    try {
      // Clear any existing interval to prevent memory leaks
      this.cleanup();

      // Set default settings if not present
      const settings = ev.payload.settings;
      const endpoint = settings.endpoint || config.prometheus.endpoint;
      const query = settings.query || config.defaultQuery;
      const unit = settings.unit || config.defaultUnit;

      // Update settings with defaults if they were missing
      if (!settings.endpoint || !settings.query || !settings.unit) {
        ev.action.setSettings({
          ...settings,
          endpoint: endpoint,
          query: query,
          unit: unit,
        });
      }

      // Initialize Prometheus driver with settings
      this.prometheusDriver = new PrometheusDriver({
        endpoint: endpoint,
        timeout: config.prometheus.timeout,
      });

      // Set initial title
      const initialValue = ev.payload.settings.value || "Loading...";
      ev.action.setTitle(initialValue);

      // Start the refresh interval
      this.intervalId = setInterval(() => {
        this.reconcile(ev).catch((error) => {
          streamDeck.logger.error("Error in scheduled reconcile:", error);
        });
      }, config.prometheus.refreshInterval);

      // Perform initial query
      this.reconcile(ev).catch((error) => {
        streamDeck.logger.error("Error in initial reconcile:", error);
      });

      streamDeck.logger.info("PrometheusAction initialized successfully");
    } catch (error) {
      streamDeck.logger.error("Error in onWillAppear:", error);
      ev.action.setTitle("Error");
    }
  }

  /**
   * Cleanup when action disappears to prevent memory leaks.
   */
  override onWillDisappear(
    ev: WillDisappearEvent<PrometheusSettings>
  ): void | Promise<void> {
    this.cleanup();
    streamDeck.logger.info("PrometheusAction cleaned up");
  }

  /**
   * Handles the user pressing a Stream Deck key.
   */
  override onKeyDown(ev: KeyDownEvent<PrometheusSettings>): void | Promise<void> {
    streamDeck.logger.info("Key pressed - triggering manual refresh");
    
    // Trigger immediate refresh on key press
    this.reconcile(ev as any).catch((error) => {
      streamDeck.logger.error("Error in manual reconcile:", error);
    });
  }

  /**
   * Handle settings changes to reinitialize Prometheus driver if needed.
   */
  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<PrometheusSettings>
  ): void | Promise<void> {
    try {
      const settings = ev.payload.settings;
      const endpoint = settings.endpoint || config.prometheus.endpoint;
      
      streamDeck.logger.info("Settings changed, reinitializing Prometheus driver");
      
      // Reinitialize the Prometheus driver with new endpoint
      this.prometheusDriver = new PrometheusDriver({
        endpoint: endpoint,
        timeout: config.prometheus.timeout,
      });

      // Trigger immediate refresh with new settings
      this.reconcile(ev as any).catch((error) => {
        streamDeck.logger.error("Error in settings change reconcile:", error);
      });
      
    } catch (error) {
      streamDeck.logger.error("Error handling settings change:", error);
      ev.action.setTitle("Error");
    }
  }

  /**
   * Fetch and update Prometheus metrics with proper error handling.
   */
  private async reconcile(ev: WillAppearEvent<PrometheusSettings>): Promise<void> {
    // Prevent concurrent queries
    if (this.isQuerying) {
      streamDeck.logger.debug("Query already in progress, skipping");
      return;
    }

    this.isQuerying = true;
    
    try {
      streamDeck.logger.debug("Starting Prometheus query");

      if (!this.prometheusDriver) {
        throw new Error("Prometheus driver not initialized");
      }

      const query = ev.payload.settings.query || config.defaultQuery;
      const endpoint = ev.payload.settings.endpoint || config.prometheus.endpoint;
      
      if (!query) {
        throw new Error("No Prometheus query configured");
      }
      
      if (!endpoint) {
        throw new Error("No Prometheus endpoint configured");
      }
      
      const result = await this.prometheusDriver.instantQuery(query);

      if (!result || !result.result || result.result.length === 0) {
        throw new Error("No data returned from Prometheus query");
      }

      const value = result.result[0]?.value?.value;
      if (value === undefined || value === null) {
        throw new Error("Invalid value in Prometheus response");
      }

      // Update settings and display
      await ev.action.setSettings({
        value: String(value),
        lastUpdate: new Date().toISOString(),
      });

      const formattedValue = this.formatValue(ev, result);
      await ev.action.setTitle(formattedValue);

      // Reset retry count on success
      this.retryCount = 0;

      streamDeck.logger.info(
        `Successfully updated metric: ${formattedValue}`
      );

    } catch (error) {
      this.retryCount++;
      streamDeck.logger.error(
        `Prometheus query failed (attempt ${this.retryCount}/${this.maxRetries}):`, 
        error
      );

      // Show error state after max retries
      if (this.retryCount >= this.maxRetries) {
        await ev.action.setTitle("Error");
        streamDeck.logger.error("Max retries reached, showing error state");
      } else {
        // Show retry indicator
        await ev.action.setTitle(`Retry ${this.retryCount}`);
      }

    } finally {
      this.isQuerying = false;
    }
  }

  /**
   * Format the value for display with proper error handling.
   */
  private formatValue(ev: WillAppearEvent<PrometheusSettings>, result: any): string {
    try {
      if (result?.result?.[0]?.value?.value !== undefined) {
        const value = result.result[0].value.value;
        const numericValue = parseFloat(value);
        
        if (isNaN(numericValue)) {
          return "Invalid";
        }

        const unit = ev.payload.settings.unit || "";
        return `${Math.round(numericValue)}${unit}`;
      }
      return "n/a";
    } catch (error) {
      streamDeck.logger.error("Error formatting value:", error);
      return "Error";
    }
  }

  /**
   * Clean up resources to prevent memory leaks.
   */
  private cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.prometheusDriver = null;
    this.isQuerying = false;
    this.retryCount = 0;
  }
}

/**
 * Settings for Prometheus action.
 */
type PrometheusSettings = {
  value: string;
  unit?: string;
  lastUpdate?: string;
  endpoint?: string;
  query?: string;
};
