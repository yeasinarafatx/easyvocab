"use client";

import { useCallback, useEffect, useState } from "react";
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
  isOnline: boolean;
  isCached: boolean;
}

/**
 * Custom hook for safely loading word data
 * Handles caching, errors, and cleanup
 */
export function useWordData(stage: string, file: string): UseWordDataResult {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [isCached, setIsCached] = useState(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the safe data loader
      const result = await dataLoader.loadData(stage, file, { forceRefresh });

      if (!result.success && result.data.length === 0) {
        setError(result.error || "Data load করা যায়নি");
        setWords([]);
        setIsCached(false);
        return;
      }

      // Show warning if data is from cache but couldn't refresh
      if (!result.success && result.data.length > 0) {
        errorLogger.warn(`Using cached data for ${stage}/${file}: ${result.error}`, "useWordData");
      }

      setWords(result.data);
      setIsCached(result.fromCache);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setWords([]);
      setIsCached(false);
      errorLogger.error("useWordData error", err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  }, [stage, file]);

  useEffect(() => {
    loadData();

    const handleOnline = () => {
      setIsOnline(true);
      void loadData(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [loadData]);

  return {
    words,
    isLoading,
    error,
    retry: loadData,
    isOnline,
    isCached,
  };
}
