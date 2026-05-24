import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useMutation(apiFunc) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await apiFunc(...args);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return result;
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { loading, error, success, mutate };
}
