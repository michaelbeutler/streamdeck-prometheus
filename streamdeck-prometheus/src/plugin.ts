import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { PrometheusAction } from "./actions/prometheus";

// Set appropriate log level (use INFO for production, DEBUG for development)
streamDeck.logger.setLevel(LogLevel.INFO);

// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
  streamDeck.logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  streamDeck.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Register the Prometheus action
streamDeck.actions.registerAction(new PrometheusAction());

// Connect to the Stream Deck
streamDeck.connect().then(() => {
  streamDeck.logger.info('StreamDeck plugin connected successfully');
}).catch((error) => {
  streamDeck.logger.error('Failed to connect to StreamDeck:', error);
});
