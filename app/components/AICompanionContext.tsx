'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

export interface PageContext {
  type: 'home' | 'article' | 'course' | 'module' | 'chat' | 'journal' | 'dreams' | 'other';
  title?: string;
  slug?: string;
  highlightedText?: string;
  /** A snippet of the page content for AI context (truncated to ~500 chars) */
  contentSnippet?: string;
}

interface AICompanionContextType {
  // State
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  isMinimized: boolean;
  error: string | null;
  pageContext: PageContext;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  setPageContext: (context: Partial<PageContext>) => void;
  setHighlightedText: (text: string | null) => void;
  toggleMinimized: () => void;
  clearConversation: () => void;
  continueInFullChat: () => void;
}

const AICompanionContext = createContext<AICompanionContextType | undefined>(undefined);

const STORAGE_KEY = 'ai-companion-conversation';
const MINIMIZED_KEY = 'ai-companion-minimized';

// ============================================================================
// Provider Component
// ============================================================================

export function AICompanionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageContext, setPageContextState] = useState<PageContext>({ type: 'home' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Initialize from localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        setConversationId(storedId);
      }

      const storedMinimized = localStorage.getItem(MINIMIZED_KEY);
      if (storedMinimized !== null) {
        setIsMinimized(storedMinimized === 'true');
      }
    } catch {
      // localStorage not available
    }
    setIsInitialized(true);
  }, []);

  // -------------------------------------------------------------------------
  // Load conversation when ID changes and user is authenticated
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || status !== 'authenticated') return;

      try {
        const response = await fetch(`/api/chat/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(
              data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                createdAt: new Date(m.createdAt),
              }))
            );
          }
        } else if (response.status === 404) {
          // Conversation doesn't exist anymore, clear it
          setConversationId(null);
          setMessages([]);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    }

    if (isInitialized) {
      loadConversation();
    }
  }, [conversationId, status, isInitialized]);

  // -------------------------------------------------------------------------
  // Persist conversationId to localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isInitialized) return;

    if (conversationId) {
      localStorage.setItem(STORAGE_KEY, conversationId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [conversationId, isInitialized]);

  // -------------------------------------------------------------------------
  // Persist minimized state to localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(MINIMIZED_KEY, String(isMinimized));
  }, [isMinimized, isInitialized]);

  // -------------------------------------------------------------------------
  // Auto-detect page context from pathname
  // -------------------------------------------------------------------------
  useEffect(() => {
    let type: PageContext['type'] = 'other';

    if (pathname === '/') {
      type = 'home';
    } else if (pathname.startsWith('/posts/')) {
      type = 'article';
    } else if (pathname.match(/^\/courses\/[^/]+\/[^/]+/)) {
      type = 'module';
    } else if (pathname.startsWith('/courses/')) {
      type = 'course';
    } else if (pathname === '/chat') {
      type = 'chat';
    } else if (pathname.startsWith('/journal')) {
      type = 'journal';
    } else if (pathname.startsWith('/dreams')) {
      type = 'dreams';
    }

    setPageContextState((prev) => ({ ...prev, type }));
  }, [pathname]);

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (status !== 'authenticated') {
      // Could redirect to login or show error
      setError('Please sign in to chat');
      return;
    }

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      // Build context string from page context
      let contextInfo = '';
      if (pageContext.type === 'article' && pageContext.title) {
        contextInfo = `User is reading the article: "${pageContext.title}"`;
        if (pageContext.contentSnippet) {
          contextInfo += `\n\nArticle excerpt:\n"${pageContext.contentSnippet}"`;
        }
      } else if (pageContext.type === 'module' && pageContext.title) {
        contextInfo = `User is on a course module: "${pageContext.title}"`;
        if (pageContext.contentSnippet) {
          contextInfo += `\n\nModule excerpt:\n"${pageContext.contentSnippet}"`;
        }
      } else if (pageContext.type === 'course' && pageContext.title) {
        contextInfo = `User is browsing the course: "${pageContext.title}"`;
        if (pageContext.contentSnippet) {
          contextInfo += `\n\nCourse description:\n"${pageContext.contentSnippet}"`;
        }
      }

      if (pageContext.highlightedText) {
        contextInfo += `\n[User highlighted: "${pageContext.highlightedText}"]`;
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
          context: `companion-${pageContext.type}`,
          pageContext: contextInfo || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'NO_CREDITS') {
          setError('Out of AI credits');
        } else if (response.status === 401) {
          setError('Please sign in');
        } else if (response.status === 429) {
          setError('Too many requests');
        } else {
          setError('Something went wrong');
        }
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('Failed to read response');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let newConversationId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));

              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }

              if (parsed.done && parsed.conversationId) {
                newConversationId = parsed.conversationId;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Update conversation ID if we got a new one
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, that's fine
        return;
      }
      console.error('Chat error:', err);
      setError('Connection failed');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationId, isLoading, status, pageContext]);

  // -------------------------------------------------------------------------
  // Set page context
  // -------------------------------------------------------------------------
  const setPageContext = useCallback((context: Partial<PageContext>) => {
    setPageContextState((prev) => ({ ...prev, ...context }));
  }, []);

  // -------------------------------------------------------------------------
  // Set highlighted text
  // -------------------------------------------------------------------------
  const setHighlightedText = useCallback((text: string | null) => {
    setPageContextState((prev) => ({ ...prev, highlightedText: text || undefined }));
  }, []);

  // -------------------------------------------------------------------------
  // Toggle minimized
  // -------------------------------------------------------------------------
  const toggleMinimized = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // -------------------------------------------------------------------------
  // Clear conversation
  // -------------------------------------------------------------------------
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // -------------------------------------------------------------------------
  // Continue in full chat (navigate to /chat with current conversation)
  // -------------------------------------------------------------------------
  const continueInFullChat = useCallback(() => {
    if (conversationId) {
      window.location.href = `/chat?conversation=${conversationId}`;
    } else {
      window.location.href = '/chat';
    }
  }, [conversationId]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <AICompanionContext.Provider
      value={{
        messages,
        conversationId,
        isLoading,
        isMinimized,
        error,
        pageContext,
        sendMessage,
        setPageContext,
        setHighlightedText,
        toggleMinimized,
        clearConversation,
        continueInFullChat,
      }}
    >
      {children}
    </AICompanionContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAICompanion() {
  const context = useContext(AICompanionContext);
  if (context === undefined) {
    throw new Error('useAICompanion must be used within an AICompanionProvider');
  }
  return context;
}
