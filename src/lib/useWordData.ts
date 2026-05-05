"use client";

import { useEffect, useState, useCallback } from "react";
import { dataLoader } from "./dataLoader";
import { errorLogger } from "./errorLogger";

interface Word {
  word: string;
  pos: string;
  phonetic: string;
  bangla: string;
  example: string;
}

interface UseWordDataResult {
  words: Word[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Custom hook for safely loading word data
 * Handles caching, errors, and cleanup
 */
export function useWordData(stage: string, file: string): UseWordDataResult {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the safe data loader
      const result = await dataLoader.loadData(stage, file);

      if (!result.success && result.data.length === 0) {
        setError(result.error || "Data load করা যায়নি");
        setWords([]);
        return;
      }

      // Show warning if data is from cache but couldn't refresh
      if (!result.success && result.data.length > 0) {
        errorLogger.warn(`Using cached data for ${stage}/${file}: ${result.error}`, "useWordData");
      }

      setWords(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setWords([]);
      errorLogger.error("useWordData error", err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  }, [stage, file]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    words,
    isLoading,
    error,
    retry: loadData,
  };
}
