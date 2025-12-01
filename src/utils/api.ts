/**
 * Environment-aware API utility module
 * Provides centralized API call functions that automatically use the correct
 * backend URL based on the current environment (local, dev, production, preview)
 */

// Get API URL from environment variables with fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'local';

/**
 * Make an API call to the backend Worker
 * @param endpoint - API endpoint path (e.g., '/api/predict')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise resolving to the JSON response
 * @throws Error if the API returns a non-OK response
 */
export async function callAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit a prediction to the backend
 * @param predictedDate - ISO date string for the user's prediction
 * @returns Promise with submission result
 */
export async function submitPrediction(predictedDate: string) {
  return callAPI('/api/predict', {
    method: 'POST',
    body: JSON.stringify({ predicted_date: predictedDate }),
  });
}

/**
 * Get current statistics from the backend
 * @returns Promise with stats (median, count, etc.)
 */
export async function getStats() {
  return callAPI('/api/stats');
}

/**
 * Get current environment information
 * @returns Object with API URL and environment name
 */
export function getEnvironmentInfo() {
  return {
    apiUrl: API_URL,
    environment: ENVIRONMENT,
  };
}
