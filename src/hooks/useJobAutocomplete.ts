import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jobsApiUrl } from '../services/apiUrl';

interface UseJobAutocompleteReturn {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
}

export function useJobAutocomplete(): UseJobAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't fetch if query is too short
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await axios.post(
          jobsApiUrl,
          { query: query.trim() },
          { signal: abortControllerRef.current.signal }
        );

        setSuggestions(response.data.suggestions || []);
        setError(null);
      } catch (err) {
        if (axios.isCancel(err)) {
          // Request was cancelled, ignore
          return;
        }
        console.error('Failed to fetch job suggestions:', err);
        setError('Failed to load suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce - waits for user to stop typing
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
