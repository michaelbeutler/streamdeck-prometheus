import { ResponseType } from 'prometheus-query';

/**
 * Utility functions for testing the Stream Deck Prometheus Plugin
 */

/**
 * Creates a mock StreamDeck action event
 */
export function createMockActionEvent(settings: any = {}) {
  return {
    action: {
      setTitle: jest.fn().mockResolvedValue(undefined),
      setSettings: jest.fn().mockResolvedValue(undefined),
    },
    payload: {
      settings
    }
  };
}

/**
 * Creates a mock Prometheus response
 */
export function createMockPrometheusResponse(value: string | number) {
  return {
    resultType: ResponseType.VECTOR,
    result: [
      {
        value: {
          value: String(value)
        }
      }
    ]
  };
}

/**
 * Creates a mock empty Prometheus response
 */
export function createEmptyPrometheusResponse() {
  return {
    resultType: ResponseType.VECTOR,
    result: []
  };
}

/**
 * Creates a mock malformed Prometheus response
 */
export function createMalformedPrometheusResponse() {
  return {
    resultType: ResponseType.VECTOR,
    result: [{}]
  };
}

/**
 * Waits for all promises to resolve
 */
export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Creates a mock error
 */
export function createMockError(message: string) {
  return new Error(message);
}