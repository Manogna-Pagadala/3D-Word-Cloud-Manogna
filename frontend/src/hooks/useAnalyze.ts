import { useState, useCallback } from 'react';
import type { AnalyzeResponse } from '../types';

// The backend server address
const API_URL='http://localhost:8000';
// Describes what this hook returns to whoever uses it
interface UseAnalyzeReturn {
  data: AnalyzeResponse | null;  // the result from the backend, null if not fetched yet
  loading: boolean;               // true while waiting for the backend to respond
  error: string | null;           // error message if something went wrong
  analyze: (url: string) => Promise<void>; // function to trigger the analysis
}
export function useAnalyze(): UseAnalyzeReturn {
  // Store result, loading state, and any error message
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // This function sends URL to backend and stores the response
  // useCallback makes sure this function is not recreated on every render
  const analyze = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // Send POST request to the backend with the article URL
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      // If server returned an error throw it to show it to the user
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `Server error: ${response.status}`);
      }
      // Store successful response data
      const result: AnalyzeResponse = await response.json();
      setData(result);
    } catch (e) {
      // Store error message to display in the UI
      setError(e instanceof Error ? e.message : 'Unknown error occurred');
    } finally {
      // Always stop the loading state when done, whether it succeeded or failed
      setLoading(false);
    }
  }, []);
  return { data, loading, error, analyze };
}