'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface ReadingListContextType {
  savedSlugs: string[];
  readSlugs: string[];
  addToList: (slug: string, title?: string) => void;
  removeFromList: (slug: string) => void;
  isInList: (slug: string) => boolean;
  markAsRead: (slug: string) => void;
  unmarkAsRead: (slug: string) => void;
  isRead: (slug: string) => boolean;
  isSyncing: boolean;
}

const ReadingListContext = createContext<ReadingListContextType | undefined>(undefined);

const STORAGE_KEY = 'integrated-human-reading-list';
const READ_STORAGE_KEY = 'integrated-human-read-articles';

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [readSlugs, setReadSlugs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedFromServer, setHasSyncedFromServer] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedSlugs(JSON.parse(stored));
      } catch {
        setSavedSlugs([]);
      }
    }
    const readStored = localStorage.getItem(READ_STORAGE_KEY);
    if (readStored) {
      try {
        setReadSlugs(JSON.parse(readStored));
      } catch {
        setReadSlugs([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync from server when user logs in
  useEffect(() => {
    async function syncFromServer() {
      if (status !== 'authenticated' || hasSyncedFromServer) return;

      setIsSyncing(true);
      try {
        // Fetch reading list
        const listResponse = await fetch('/api/reading-list');
        if (listResponse.ok) {
          const serverSlugs: string[] = await listResponse.json();
          setSavedSlugs((localSlugs) => {
            const merged = [...new Set([...localSlugs, ...serverSlugs])];
            return merged;
          });
        }

        // Fetch article progress (read articles)
        const progressResponse = await fetch('/api/article-progress');
        if (progressResponse.ok) {
          const serverProgress: { slug: string; completed: boolean }[] = await progressResponse.json();
          const completedSlugs = serverProgress.filter(p => p.completed).map(p => p.slug);
          setReadSlugs((localRead) => {
            const merged = [...new Set([...localRead, ...completedSlugs])];
            return merged;
          });
        }

        setHasSyncedFromServer(true);
      } catch (error) {
        console.error('Failed to sync from server:', error);
      } finally {
        setIsSyncing(false);
      }
    }

    if (isLoaded) {
      syncFromServer();
    }
  }, [status, isLoaded, hasSyncedFromServer]);

  // Sync reading list changes to server when logged in
  const syncToServer = useCallback(async (slug: string, action: 'add' | 'remove', title?: string) => {
    if (status !== 'authenticated') return;

    try {
      if (action === 'add') {
        await fetch('/api/reading-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, title }),
        });
      } else {
        await fetch('/api/reading-list', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
      }
    } catch (error) {
      console.error('Failed to sync reading list to server:', error);
    }
  }, [status]);

  // Sync article progress to server when logged in
  const syncProgressToServer = useCallback(async (slug: string, completed: boolean) => {
    if (status !== 'authenticated') return;

    try {
      if (completed) {
        await fetch('/api/article-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, completed: true }),
        });
      } else {
        await fetch('/api/article-progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
      }
    } catch (error) {
      console.error('Failed to sync article progress to server:', error);
    }
  }, [status]);

  // Persist to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSlugs));
    }
  }, [savedSlugs, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readSlugs));
    }
  }, [readSlugs, isLoaded]);

  const addToList = useCallback((slug: string, title?: string) => {
    setSavedSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
    syncToServer(slug, 'add', title);
  }, [syncToServer]);

  const removeFromList = useCallback((slug: string) => {
    setSavedSlugs((prev) => prev.filter((s) => s !== slug));
    syncToServer(slug, 'remove');
  }, [syncToServer]);

  const isInList = useCallback((slug: string) => savedSlugs.includes(slug), [savedSlugs]);

  const markAsRead = useCallback((slug: string) => {
    setReadSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
    syncProgressToServer(slug, true);
  }, [syncProgressToServer]);

  const unmarkAsRead = useCallback((slug: string) => {
    setReadSlugs((prev) => prev.filter((s) => s !== slug));
    syncProgressToServer(slug, false);
  }, [syncProgressToServer]);

  const isRead = useCallback((slug: string) => readSlugs.includes(slug), [readSlugs]);

  return (
    <ReadingListContext.Provider value={{ savedSlugs, readSlugs, addToList, removeFromList, isInList, markAsRead, unmarkAsRead, isRead, isSyncing }}>
      {children}
    </ReadingListContext.Provider>
  );
}

export function useReadingList() {
  const context = useContext(ReadingListContext);
  if (context === undefined) {
    throw new Error('useReadingList must be used within a ReadingListProvider');
  }
  return context;
}
