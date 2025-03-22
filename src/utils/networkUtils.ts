/**
 * Utility functions for network operations
 */

/**
 * Checks if a URL is valid
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith("http") ? url : `http://${url}`);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Ensures a URL has a protocol (http:// or https://)
 * @param url The URL to process
 * @returns The URL with a protocol
 */
export const ensureProtocol = (url: string): string => {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Extracts the domain from a URL
 * @param url The URL to process
 * @returns The domain part of the URL
 */
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(ensureProtocol(url));
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

/**
 * Formats a response time in milliseconds to a human-readable string
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export const formatResponseTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
};
