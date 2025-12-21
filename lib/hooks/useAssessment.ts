'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type AssessmentType = 'archetype' | 'attachment' | 'nervous-system' | 'values';

interface SavedAssessment {
  id: string;
  type: AssessmentType;
  results: Record<string, unknown>;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAssessmentReturn {
  isAuthenticated: boolean;
  isSaving: boolean;
  isLoading: boolean;
  savedResult: SavedAssessment | null;
  error: string | null;
  saveResults: (results: Record<string, unknown>, summary?: string) => Promise<boolean>;
  loadResults: () => Promise<SavedAssessment | null>;
  clearError: () => void;
}

export function useAssessment(type: AssessmentType): UseAssessmentReturn {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedResult, setSavedResult] = useState<SavedAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const saveResults = useCallback(async (
    results: Record<string, unknown>,
    summary?: string
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      // Don't show error - just silently skip saving for non-authenticated users
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, results, summary }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save results');
      }

      const data = await response.json();
      setSavedResult(data.result);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save results';
      setError(message);
      console.error('Error saving assessment:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, type]);

  const loadResults = useCallback(async (): Promise<SavedAssessment | null> => {
    if (!isAuthenticated) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessments?type=${type}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load results');
      }

      const data = await response.json();
      setSavedResult(data.result);
      return data.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results';
      setError(message);
      console.error('Error loading assessment:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, type]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    isSaving,
    isLoading,
    savedResult,
    error,
    saveResults,
    loadResults,
    clearError,
  };
}
