'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReadingListContextType {
  savedSlugs: string[];
  readSlugs: string[];
  addToList: (slug: string) => void;
  removeFromList: (slug: string) => void;
  isInList: (slug: string) => boolean;
  markAsRead: (slug: string) => void;
  isRead: (slug: string) => boolean;
}

const ReadingListContext = createContext<ReadingListContextType | undefined>(undefined);

const STORAGE_KEY = 'integrated-human-reading-list';
const READ_STORAGE_KEY = 'integrated-human-read-articles';

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [readSlugs, setReadSlugs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const addToList = (slug: string) => {
    setSavedSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  };

  const removeFromList = (slug: string) => {
    setSavedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const isInList = (slug: string) => savedSlugs.includes(slug);

  const markAsRead = (slug: string) => {
    setReadSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  };

  const isRead = (slug: string) => readSlugs.includes(slug);

  return (
    <ReadingListContext.Provider value={{ savedSlugs, readSlugs, addToList, removeFromList, isInList, markAsRead, isRead }}>
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
