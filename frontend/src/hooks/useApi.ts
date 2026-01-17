import { useState, useCallback } from 'react';
import api from '../api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T = any>(
    apiCall: () => Promise<{ data: T }>,
    options?: UseApiOptions
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      options?.onError?.(err);
      console.error('API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}
