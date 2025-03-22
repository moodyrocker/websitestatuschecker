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

// Type definition for check history items
export interface CheckHistoryItem {
  url: string;
  timestamp: string;
  success: boolean;
  responseTime: number;
  errorMessage?: string;
}

/**
 * Saves a check result to local storage
 * @param item The check result to save
 */
export const saveCheckToHistory = (item: CheckHistoryItem): void => {
  try {
    // Get existing history
    const history = getCheckHistory();

    // Add new item at the beginning
    history.unshift(item);

    // Keep only the top 50 items
    const trimmedHistory = history.slice(0, 50);

    // Save back to localStorage
    localStorage.setItem("websiteCheckHistory", JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to save check to history:", error);
  }
};

/**
 * Gets the check history from local storage
 * @returns Array of check history items
 */
export const getCheckHistory = (): CheckHistoryItem[] => {
  try {
    const historyJson = localStorage.getItem("websiteCheckHistory");
    if (!historyJson) return [];

    return JSON.parse(historyJson);
  } catch (error) {
    console.error("Failed to get check history:", error);
    return [];
  }
};

/**
 * Exports the check history as a JSON file for download
 */
export const exportCheckHistory = (): void => {
  try {
    const history = getCheckHistory();
    if (history.length === 0) {
      alert("No check history to export");
      return;
    }

    // Create a JSON blob
    const historyJson = JSON.stringify(history, null, 2);
    const blob = new Blob([historyJson], { type: "application/json" });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-check-history-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Failed to export check history:", error);
    alert("Failed to export check history");
  }
};
