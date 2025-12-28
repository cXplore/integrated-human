'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  failed?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  starred?: boolean;
  tags?: string[];
}

interface ContextInfo {
  hasHealthContext: boolean;
  dataFreshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  suggestedActions?: string[];
}

type Stance = 'mirror' | 'companion' | 'guide' | 'anchor' | 'challenger' | 'witness' | 'teacher';

const STANCE_INFO: Record<Stance, { label: string; icon: string; color: string; description: string }> = {
  mirror: {
    label: 'Mirror',
    icon: '◐',
    color: 'text-blue-400',
    description: 'Reflecting your truth back to you',
  },
  companion: {
    label: 'Companion',
    icon: '◑',
    color: 'text-purple-400',
    description: 'Walking beside you',
  },
  guide: {
    label: 'Guide',
    icon: '◈',
    color: 'text-amber-400',
    description: 'Offering direction when sought',
  },
  anchor: {
    label: 'Anchor',
    icon: '⚓',
    color: 'text-teal-400',
    description: 'Grounding you in the present',
  },
  challenger: {
    label: 'Challenger',
    icon: '⚡',
    color: 'text-orange-400',
    description: 'Inviting growth through friction',
  },
  witness: {
    label: 'Witness',
    icon: '◉',
    color: 'text-indigo-400',
    description: 'Holding space without fixing',
  },
  teacher: {
    label: 'Teacher',
    icon: '✦',
    color: 'text-emerald-400',
    description: 'Sharing knowledge when invited',
  },
};

interface Props {
  userName?: string;
}

export default function ChatInterface({ userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [conversationSearch, setConversationSearch] = useState('');
  const [currentStance, setCurrentStance] = useState<Stance | null>(null);
  const [showStanceInfo, setShowStanceInfo] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestionsDismissed, setTagSuggestionsDismissed] = useState(false);
  const [applyingTag, setApplyingTag] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [savingToJournal, setSavingToJournal] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);
  const [journalingPrompts, setJournalingPrompts] = useState<Array<{
    prompt: string;
    focus: string;
  }>>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [suggestedPractices, setSuggestedPractices] = useState<Array<{
    slug: string;
    title: string;
    description: string;
    duration: string;
    relevance: string;
  }>>([]);
  const [showPracticeSuggestions, setShowPracticeSuggestions] = useState(false);
  const [practiceSuggestionsDismissed, setPracticeSuggestionsDismissed] = useState(false);
  const [detectedMood, setDetectedMood] = useState<{
    primaryMood: string;
    intensity: 'low' | 'moderate' | 'high';
    valence: 'positive' | 'negative' | 'neutral';
    confidence: number;
  } | null>(null);
  const [recurringPatterns, setRecurringPatterns] = useState<Array<{
    pattern: string;
    label: string;
    frequency: number;
    conversationCount: number;
    recentMention: string;
    insight: string;
  }>>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [patternsDismissed, setPatternsDismissed] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<Array<{
    slug: string;
    title: string;
    excerpt: string;
    readingTime: string;
    relevance: string;
  }>>([]);
  const [showArticleSuggestions, setShowArticleSuggestions] = useState(false);
  const [articleSuggestionsDismissed, setArticleSuggestionsDismissed] = useState(false);
  const [welcomeContext, setWelcomeContext] = useState<{
    greeting: string;
    lastConversationSummary?: string;
    daysSinceLastChat: number | null;
    suggestedTopic?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageCountRef = useRef(0);
  const tagSuggestionFetchedRef = useRef(false);
  const practiceSuggestionFetchedRef = useRef(false);
  const articleSuggestionFetchedRef = useRef(false);
  const lastMoodCheckRef = useRef(0);

  // Estimate tokens for display (rough: 1 token ≈ 4 chars)
  const estimatedTokens = Math.ceil(input.length / 4);

  // Get all unique tags from conversations
  const allTags = Array.from(
    new Set(conversations.flatMap(c => c.tags || []))
  ).sort();

  // Filter conversations by search, starred, and tags
  const filteredConversations = conversations.filter(c => {
    // Text search filter
    if (conversationSearch.trim() &&
        !c.title?.toLowerCase().includes(conversationSearch.toLowerCase())) {
      return false;
    }
    // Starred filter
    if (showStarredOnly && !c.starred) {
      return false;
    }
    // Tag filter
    if (filterTag && (!c.tags || !c.tags.includes(filterTag))) {
      return false;
    }
    return true;
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Load active conversation, context info, patterns, and welcome on mount
  useEffect(() => {
    loadConversations();
    loadContextInfo();
    // Fetch patterns for returning users (shows on empty chat state)
    fetchRecurringPatterns();
    // Fetch personalized welcome message
    fetchWelcomeContext();
  }, []);

  // Fetch tag suggestions when conversation has enough messages
  useEffect(() => {
    const messageCount = messages.length;
    const threshold = 6; // Suggest tags after 6 messages (3 exchanges)

    // Only fetch if:
    // - We have a conversationId
    // - Messages crossed the threshold
    // - Suggestions haven't been dismissed
    // - We haven't fetched yet for this conversation
    if (
      conversationId &&
      messageCount >= threshold &&
      lastMessageCountRef.current < threshold &&
      !tagSuggestionsDismissed &&
      !tagSuggestionFetchedRef.current &&
      !isLoading
    ) {
      fetchSuggestedTags();
    }

    lastMessageCountRef.current = messageCount;
  }, [messages.length, conversationId, tagSuggestionsDismissed, isLoading]);

  // Reset tag, practice, and article suggestion state when conversation changes
  useEffect(() => {
    setSuggestedTags([]);
    setShowTagSuggestions(false);
    setTagSuggestionsDismissed(false);
    tagSuggestionFetchedRef.current = false;
    setSuggestedPractices([]);
    setShowPracticeSuggestions(false);
    setPracticeSuggestionsDismissed(false);
    practiceSuggestionFetchedRef.current = false;
    setSuggestedArticles([]);
    setShowArticleSuggestions(false);
    setArticleSuggestionsDismissed(false);
    articleSuggestionFetchedRef.current = false;
    setDetectedMood(null);
    lastMoodCheckRef.current = 0;
    lastMessageCountRef.current = 0;
  }, [conversationId]);

  // Fetch practice suggestions after 4 messages (earlier than tags)
  useEffect(() => {
    const messageCount = messages.length;
    const threshold = 4; // Suggest practices after 4 messages (2 exchanges)

    if (
      conversationId &&
      messageCount >= threshold &&
      !practiceSuggestionsDismissed &&
      !practiceSuggestionFetchedRef.current &&
      !isLoading
    ) {
      fetchSuggestedPractices();
    }
  }, [messages.length, conversationId, practiceSuggestionsDismissed, isLoading]);

  // Detect mood periodically during conversation
  useEffect(() => {
    const messageCount = messages.length;
    // Check mood every 3 new user messages
    const userMessageCount = messages.filter(m => m.role === 'user').length;

    if (
      conversationId &&
      userMessageCount >= 2 &&
      userMessageCount > lastMoodCheckRef.current &&
      (userMessageCount - lastMoodCheckRef.current >= 3 || lastMoodCheckRef.current === 0) &&
      !isLoading
    ) {
      detectMood();
      lastMoodCheckRef.current = userMessageCount;
    }
  }, [messages.length, conversationId, isLoading]);

  // Fetch article suggestions after 8 messages (later than practices, to not overwhelm)
  useEffect(() => {
    const messageCount = messages.length;
    const threshold = 8; // Suggest articles after 8 messages (4 exchanges)

    if (
      conversationId &&
      messageCount >= threshold &&
      !articleSuggestionsDismissed &&
      !articleSuggestionFetchedRef.current &&
      !isLoading
    ) {
      fetchSuggestedArticles();
    }
  }, [messages.length, conversationId, articleSuggestionsDismissed, isLoading]);

  const fetchSuggestedTags = async () => {
    if (!conversationId) return;

    tagSuggestionFetchedRef.current = true;

    try {
      const res = await fetch('/api/chat/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Filter out tags already on the conversation
        const currentConv = conversations.find(c => c.id === conversationId);
        const existingTags = currentConv?.tags || [];
        const newSuggestions = data.suggestedTags.filter(
          (tag: string) => !existingTags.includes(tag)
        );

        if (newSuggestions.length > 0) {
          setSuggestedTags(newSuggestions);
          setShowTagSuggestions(true);
        }
      }
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
    }
  };

  const fetchSuggestedPractices = async () => {
    if (!conversationId) return;

    practiceSuggestionFetchedRef.current = true;

    try {
      const res = await fetch('/api/chat/suggest-practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestedPractices && data.suggestedPractices.length > 0) {
          setSuggestedPractices(data.suggestedPractices);
          setShowPracticeSuggestions(true);
        }
      }
    } catch (err) {
      console.error('Error fetching practice suggestions:', err);
    }
  };

  const dismissPracticeSuggestions = () => {
    setShowPracticeSuggestions(false);
    setPracticeSuggestionsDismissed(true);
    setSuggestedPractices([]);
  };

  const detectMood = async () => {
    if (!conversationId) return;

    try {
      const res = await fetch('/api/chat/detect-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mood) {
          setDetectedMood(data.mood);
        }
      }
    } catch (err) {
      console.error('Error detecting mood:', err);
    }
  };

  const fetchRecurringPatterns = async () => {
    if (patternsDismissed) return;

    setLoadingPatterns(true);
    try {
      const res = await fetch('/api/chat/patterns');
      if (res.ok) {
        const data = await res.json();
        if (data.patterns && data.patterns.length > 0) {
          setRecurringPatterns(data.patterns);
          setShowPatterns(true);
        }
      }
    } catch (err) {
      console.error('Error fetching patterns:', err);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const dismissPatterns = () => {
    setShowPatterns(false);
    setPatternsDismissed(true);
  };

  const fetchWelcomeContext = async () => {
    try {
      const res = await fetch('/api/chat/welcome-back');
      if (res.ok) {
        const data = await res.json();
        setWelcomeContext(data);
      }
    } catch (err) {
      console.error('Error fetching welcome context:', err);
    }
  };

  const fetchSuggestedArticles = async () => {
    if (!conversationId) return;

    articleSuggestionFetchedRef.current = true;

    try {
      const res = await fetch('/api/chat/suggest-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestedArticles && data.suggestedArticles.length > 0) {
          setSuggestedArticles(data.suggestedArticles);
          setShowArticleSuggestions(true);
        }
      }
    } catch (err) {
      console.error('Error fetching article suggestions:', err);
    }
  };

  const dismissArticleSuggestions = () => {
    setShowArticleSuggestions(false);
    setArticleSuggestionsDismissed(true);
    setSuggestedArticles([]);
  };

  const applySuggestedTag = async (tag: string) => {
    if (!conversationId) return;

    setApplyingTag(tag);
    const currentConv = conversations.find(c => c.id === conversationId);
    const currentTags = currentConv?.tags || [];

    try {
      await addTag(conversationId, currentTags, tag);
      // Remove the applied tag from suggestions
      setSuggestedTags(prev => prev.filter(t => t !== tag));
      // If no more suggestions, hide the panel
      if (suggestedTags.length <= 1) {
        setShowTagSuggestions(false);
      }
    } catch (err) {
      console.error('Error applying suggested tag:', err);
    } finally {
      setApplyingTag(null);
    }
  };

  const dismissTagSuggestions = () => {
    setShowTagSuggestions(false);
    setTagSuggestionsDismissed(true);
    setSuggestedTags([]);
  };

  const generateSummary = async () => {
    if (!conversationId || messages.length < 4) return;

    setShowSummary(true);
    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate summary');
      }

      const data = await res.json();
      setSummaryContent(data.summary);
    } catch (err) {
      console.error('Error generating summary:', err);
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setSummaryContent(null);
    setSummaryError(null);
    setSavedToJournal(false);
    setJournalingPrompts([]);
  };

  const generateJournalingPrompts = async () => {
    if (!conversationId || messages.length < 4) return;

    setLoadingPrompts(true);

    try {
      const res = await fetch('/api/chat/journaling-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        setJournalingPrompts(data.prompts || []);
      }
    } catch (err) {
      console.error('Error generating journaling prompts:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const saveToJournal = async () => {
    if (!summaryContent || !conversationId) return;

    setSavingToJournal(true);

    try {
      // Get conversation title
      const currentConv = conversations.find(c => c.id === conversationId);

      const res = await fetch('/api/chat/save-to-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          summary: summaryContent,
          conversationTitle: currentConv?.title,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save to journal');
      }

      setSavedToJournal(true);
    } catch (err) {
      console.error('Error saving to journal:', err);
      setSummaryError('Failed to save to journal');
    } finally {
      setSavingToJournal(false);
    }
  };

  const loadContextInfo = async () => {
    try {
      const res = await fetch('/api/chat/context-info');
      if (res.ok) {
        const data = await res.json();
        setContextInfo(data);
      }
    } catch (err) {
      console.error('Error loading context info:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);

        // Load the most recent active conversation
        const active = data.conversations?.find((c: Conversation & { isActive?: boolean }) => c.isActive);
        if (active) {
          loadConversation(active.id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadConversation = async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation.id);
        setMessages(
          data.conversation.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoadingHistory(false);
      setShowHistory(false);
    }
  };

  const startNewConversation = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'general' }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation.id);
        setMessages([]);
        setShowHistory(false);
        loadConversations();
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation
    if (!confirm('Delete this conversation?')) return;

    setDeletingConversation(id);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // If we deleted the current conversation, clear it
        if (id === conversationId) {
          setConversationId(null);
          setMessages([]);
        }
        loadConversations();
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setDeletingConversation(null);
    }
  };

  const toggleStarred = async (id: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, starred: !currentStarred } : c)
        );
      }
    } catch (err) {
      console.error('Error toggling starred:', err);
    }
  };

  const addTag = async (id: string, currentTags: string[], newTag: string) => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (!trimmedTag || currentTags.includes(trimmedTag)) {
      setTagInput('');
      setEditingTags(null);
      return;
    }

    const updatedTags = [...currentTags, trimmedTag];
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, tags: updatedTags } : c)
        );
      }
    } catch (err) {
      console.error('Error adding tag:', err);
    }
    setTagInput('');
    setEditingTags(null);
  };

  const removeTag = async (id: string, currentTags: string[], tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, tags: updatedTags } : c)
        );
      }
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  const sendMessage = async (retryContent?: string) => {
    const messageContent = retryContent || input.trim();
    if (!messageContent || isLoading) return;

    // Clear failed message state if retrying
    if (retryContent) {
      setFailedMessage(null);
      // Remove the failed message from the list
      setMessages((prev) => prev.filter((m) => !m.failed));
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!retryContent) setInput('');
    setIsLoading(true);
    setError(null);

    // Create placeholder for assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.filter(m => !m.failed).slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: 'standalone-chat',
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Mark user message as failed and store for retry
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== assistantId)
            .map((m) => m.id === userMessage.id ? { ...m, failed: true } : m)
        );
        setFailedMessage(userMessage.content);

        // Set appropriate error message based on error code
        if (errorData.code === 'NO_CREDITS') {
          setError('Out of AI credits. Add more in your profile to continue.');
        } else if (response.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 502 || response.status === 503) {
          setError('AI is temporarily unavailable. Please try again in a moment.');
        } else if (response.status === 504) {
          setError('Request timed out. Try sending a shorter message.');
        } else {
          setError(errorData.message || 'Something went wrong. Try again?');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
              if (parsed.done) {
                if (parsed.usage) {
                  setTokenBalance(parsed.usage.remainingBalance);
                }
                if (parsed.stance) {
                  setCurrentStance(parsed.stance as Stance);
                }
                if (parsed.conversationId && !conversationId) {
                  setConversationId(parsed.conversationId);
                  loadConversations();
                }
                // Update mood from stream response (more accurate than separate API)
                if (parsed.emotionalState) {
                  const intensityMap: Record<number, 'low' | 'moderate' | 'high'> = {
                    1: 'low', 2: 'low', 3: 'low',
                    4: 'moderate', 5: 'moderate', 6: 'moderate',
                    7: 'high', 8: 'high', 9: 'high', 10: 'high',
                  };
                  setDetectedMood({
                    primaryMood: parsed.emotionalState.mood,
                    intensity: intensityMap[parsed.emotionalState.intensity] || 'moderate',
                    valence: ['joyful', 'grateful', 'hopeful', 'calm', 'empowered'].includes(parsed.emotionalState.mood) ? 'positive' :
                             ['neutral', 'curious'].includes(parsed.emotionalState.mood) ? 'neutral' : 'negative',
                    confidence: 80,
                  });
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Mark message as failed for retry
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== assistantId)
          .map((m) => m.id === userMessage.id ? { ...m, failed: true } : m)
      );
      setFailedMessage(userMessage.content);
      setError('Connection failed. Check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedMessage = () => {
    if (failedMessage) {
      sendMessage(failedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check if input is disabled
  const inputDisabled = isLoading || loadingHistory;

  const exportChat = () => {
    if (messages.length === 0) return;

    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Use personalized welcome context or fallback to simple greeting
  const greeting = welcomeContext?.greeting ||
    (userName ? `Hello, ${userName.split(' ')[0]}` : 'Hello');

  // Mood display configuration
  const MOOD_DISPLAY: Record<string, { emoji: string; color: string; label: string }> = {
    anxious: { emoji: '😰', color: 'text-amber-400', label: 'Feeling anxious' },
    sad: { emoji: '😢', color: 'text-blue-400', label: 'Feeling down' },
    angry: { emoji: '😤', color: 'text-red-400', label: 'Feeling frustrated' },
    confused: { emoji: '😕', color: 'text-gray-400', label: 'Feeling uncertain' },
    hopeful: { emoji: '🌟', color: 'text-yellow-300', label: 'Feeling hopeful' },
    calm: { emoji: '😌', color: 'text-green-400', label: 'Feeling calm' },
    grateful: { emoji: '🙏', color: 'text-pink-400', label: 'Feeling grateful' },
    tired: { emoji: '😴', color: 'text-indigo-400', label: 'Feeling tired' },
    numb: { emoji: '😶', color: 'text-gray-500', label: 'Feeling disconnected' },
    curious: { emoji: '🤔', color: 'text-cyan-400', label: 'Feeling curious' },
  };

  const moodDisplay = detectedMood && MOOD_DISPLAY[detectedMood.primaryMood];

  // Generate contextual follow-up suggestions based on last message
  const getSuggestions = (): string[] => {
    if (messages.length === 0 || isLoading) return [];

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return [];

    const content = lastAssistant.content.toLowerCase();

    // Context-aware suggestions based on AI response content
    if (content.includes('shadow') || content.includes('unconscious')) {
      return ['How do I recognize my shadow?', 'What triggers might reveal it?'];
    }
    if (content.includes('breath') || content.includes('nervous system')) {
      return ['Can you guide me through a practice?', 'What else calms the nervous system?'];
    }
    if (content.includes('dream') || content.includes('symbol')) {
      return ['What else could this mean?', 'How do I work with this insight?'];
    }
    if (content.includes('relationship') || content.includes('attachment')) {
      return ['How do I communicate this?', 'What patterns should I watch for?'];
    }
    if (content.includes('stuck') || content.includes('block')) {
      return ['What might be underneath this?', 'What small step could I take?'];
    }
    if (content.includes('practice') || content.includes('exercise')) {
      return ['How often should I do this?', 'What if I struggle with it?'];
    }

    // Default suggestions
    return ['Tell me more', 'What practice would help?'];
  };

  const suggestions = getSuggestions();

  const getContextTooltip = (): string => {
    if (!contextInfo?.hasHealthContext) return 'No personalization data';
    switch (contextInfo.dataFreshness) {
      case 'fresh':
        return 'AI has your latest health context';
      case 'aging':
        return 'Context is a few days old - consider a quick check-in';
      case 'stale':
        return 'Context is outdated - AI will ask about your current state';
      case 'expired':
        return 'Context is very old - AI will focus on your present experience';
      default:
        return 'AI is personalized to your journey';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-medium">AI Companion</h1>
                {currentStance && STANCE_INFO[currentStance] && (
                  <button
                    onClick={() => setShowStanceInfo(!showStanceInfo)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${STANCE_INFO[currentStance].color} bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors`}
                    title={STANCE_INFO[currentStance].description}
                  >
                    <span>{STANCE_INFO[currentStance].icon}</span>
                    <span className="hidden sm:inline">{STANCE_INFO[currentStance].label}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {showStanceInfo && currentStance && STANCE_INFO[currentStance]
                  ? STANCE_INFO[currentStance].description
                  : 'Personal growth conversation'
                }</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Context awareness indicator */}
            {contextInfo?.hasHealthContext && (
              <div className="flex items-center gap-1" title={getContextTooltip()}>
                <span
                  className={`w-2 h-2 rounded-full ${
                    contextInfo.dataFreshness === 'fresh'
                      ? 'bg-green-500'
                      : contextInfo.dataFreshness === 'aging'
                      ? 'bg-yellow-500'
                      : contextInfo.dataFreshness === 'stale'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {contextInfo.dataFreshness === 'fresh'
                    ? 'Context fresh'
                    : contextInfo.dataFreshness === 'aging'
                    ? 'Context aging'
                    : 'Context stale'}
                </span>
              </div>
            )}
            {/* Mood indicator */}
            {moodDisplay && detectedMood && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 ${moodDisplay.color}`}
                title={`${moodDisplay.label}${detectedMood.intensity === 'high' ? ' (strongly)' : detectedMood.intensity === 'low' ? ' (mildly)' : ''}`}
              >
                <span className="text-sm">{moodDisplay.emoji}</span>
                <span className="text-xs hidden sm:inline opacity-80">{detectedMood.primaryMood}</span>
              </div>
            )}
            {tokenBalance !== null && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                {Math.floor(tokenBalance / 1000)}k tokens
              </span>
            )}
            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-500 hover:text-white transition-colors p-2"
              aria-label="Chat history"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Export button */}
            {messages.length > 0 && (
              <button
                onClick={exportChat}
                className="text-gray-500 hover:text-white transition-colors p-2"
                aria-label="Export chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {/* Summary/Insights button */}
            {messages.length >= 4 && (
              <button
                onClick={generateSummary}
                className="text-gray-500 hover:text-white transition-colors p-2"
                aria-label="Get conversation insights"
                title="Get AI insights from this conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
            )}
            {/* New chat button */}
            <button
              onClick={startNewConversation}
              className="text-gray-500 hover:text-white transition-colors p-2"
              aria-label="New chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Stale data banner */}
      {contextInfo?.hasHealthContext &&
        (contextInfo.dataFreshness === 'stale' || contextInfo.dataFreshness === 'expired') &&
        messages.length === 0 && (
          <div className="bg-amber-900/30 border-b border-amber-800/50">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-200">
                    {contextInfo.dataFreshness === 'expired'
                      ? "It's been a while since you checked in. I'll ask about how you're doing now rather than assuming."
                      : "Your health context is a bit outdated. Things may have changed since we last talked."}
                  </p>
                  {contextInfo.suggestedActions && contextInfo.suggestedActions.length > 0 && (
                    <p className="text-xs text-amber-400/80 mt-1">
                      Tip: {contextInfo.suggestedActions[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* History sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-20 md:relative md:inset-auto">
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setShowHistory(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto md:relative md:w-full">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Conversations</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-white md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Search */}
              {conversations.length >= 3 && (
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
                  />
                  {conversationSearch && (
                    <button
                      onClick={() => setConversationSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {/* Filters */}
              {conversations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {/* Starred filter */}
                  <button
                    onClick={() => setShowStarredOnly(!showStarredOnly)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      showStarredOnly
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <svg className="w-3 h-3" fill={showStarredOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Starred
                  </button>
                  {/* Tag filter dropdown */}
                  {allTags.length > 0 && (
                    <select
                      value={filterTag || ''}
                      onChange={(e) => setFilterTag(e.target.value || null)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="">All tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  )}
                  {/* Clear filters */}
                  {(showStarredOnly || filterTag || conversationSearch) && (
                    <button
                      onClick={() => {
                        setShowStarredOnly(false);
                        setFilterTag(null);
                        setConversationSearch('');
                      }}
                      className="text-xs text-gray-500 hover:text-white underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">No conversations yet</p>
                  <p className="text-gray-600 text-xs">Start a new chat to begin</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <p className="text-gray-500 text-sm">No matching conversations</p>
                  <button
                    onClick={() => {
                      setConversationSearch('');
                      setShowStarredOnly(false);
                      setFilterTag(null);
                    }}
                    className="text-purple-400 hover:text-purple-300 text-xs mt-2"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group w-full text-left p-3 rounded-lg mb-1 transition-colors cursor-pointer ${
                      conv.id === conversationId
                        ? 'bg-purple-600/20 text-white'
                        : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {conv.starred && (
                            <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                          <p className="text-sm truncate">{conv.title}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.messageCount} messages
                        </p>
                        {/* Tags */}
                        {conv.tags && conv.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conv.tags.map(tag => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilterTag(tag);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-700/50 rounded text-xs text-gray-400 hover:bg-zinc-600/50 cursor-pointer"
                              >
                                #{tag}
                                <button
                                  onClick={(e) => removeTag(conv.id, conv.tags || [], tag, e)}
                                  className="text-gray-500 hover:text-red-400 hidden group-hover:inline"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Tag input */}
                        {editingTags === conv.id && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addTag(conv.id, conv.tags || [], tagInput);
                                } else if (e.key === 'Escape') {
                                  setEditingTags(null);
                                  setTagInput('');
                                }
                              }}
                              onBlur={() => {
                                if (tagInput.trim()) {
                                  addTag(conv.id, conv.tags || [], tagInput);
                                } else {
                                  setEditingTags(null);
                                }
                              }}
                              placeholder="Add tag..."
                              autoFocus
                              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleStarred(conv.id, !!conv.starred, e)}
                          className={`p-1 transition-colors ${conv.starred ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                          aria-label={conv.starred ? 'Unstar' : 'Star'}
                        >
                          <svg className="w-4 h-4" fill={conv.starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTags(editingTags === conv.id ? null : conv.id);
                            setTagInput('');
                          }}
                          className="p-1 text-gray-500 hover:text-purple-400 transition-colors"
                          aria-label="Add tag"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          disabled={deletingConversation === conv.id}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          aria-label="Delete conversation"
                        >
                          {deletingConversation === conv.id ? (
                            <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {loadingHistory ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl text-white font-serif mb-2">{greeting}</h2>

              {/* Contextual welcome message */}
              {welcomeContext?.lastConversationSummary && (
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
                  {welcomeContext.lastConversationSummary}
                </p>
              )}

              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {welcomeContext?.suggestedTopic || (
                  <>I&apos;m here to support your journey. What&apos;s on your mind?</>
                )}
              </p>

              {/* Conversation starters */}
              <div className="grid gap-3 max-w-md mx-auto mt-6">
                {[
                  'I\'ve been feeling stuck lately...',
                  'Help me understand my patterns',
                  'I had an interesting dream last night',
                  'What practice would help me right now?',
                ].map((starter) => (
                  <button
                    key={starter}
                    onClick={() => setInput(starter)}
                    className="text-left px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                  >
                    {starter}
                  </button>
                ))}
              </div>

              {/* Recurring patterns insight */}
              {showPatterns && recurringPatterns.length > 0 && (
                <div className="mt-10 max-w-lg mx-auto">
                  <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-indigo-200 mb-3">
                            I&apos;ve noticed some themes across your recent conversations:
                          </p>
                          <div className="space-y-3">
                            {recurringPatterns.slice(0, 3).map(pattern => (
                              <div
                                key={pattern.pattern}
                                className="bg-indigo-800/20 border border-indigo-700/30 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-indigo-300 font-medium text-sm capitalize">
                                    {pattern.label}
                                  </span>
                                  <span className="text-indigo-500 text-xs">
                                    ({pattern.conversationCount} conversations)
                                  </span>
                                </div>
                                <p className="text-xs text-indigo-400/80">
                                  {pattern.insight}
                                </p>
                                <p className="text-xs text-indigo-500/60 mt-1">
                                  Last mentioned {pattern.recentMention}
                                </p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-indigo-400/70 mt-3">
                            Would you like to explore any of these themes today?
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={dismissPatterns}
                        className="text-indigo-400 hover:text-indigo-200 p-1 flex-shrink-0"
                        aria-label="Dismiss patterns"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6" role="log" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? message.failed
                          ? 'bg-red-900/50 text-red-200 border border-red-800'
                          : 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' && !message.content && isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : message.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => (
                              <code className="bg-zinc-700 px-1 py-0.5 rounded text-sm">{children}</code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-purple-500 pl-3 italic text-gray-400">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Suggested follow-ups */}
              {suggestions.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 text-xs bg-zinc-800/50 border border-zinc-700 rounded-full text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* AI-suggested tags banner */}
              {showTagSuggestions && suggestedTags.length > 0 && (
                <div className="mt-6 bg-purple-900/20 border border-purple-800/40 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-purple-200 mb-2">
                          Based on our conversation, these topics seem relevant:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => applySuggestedTag(tag)}
                              disabled={applyingTag === tag}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-full text-sm text-purple-200 transition-colors disabled:opacity-50"
                            >
                              {applyingTag === tag ? (
                                <div className="w-3 h-3 border border-purple-300 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={dismissTagSuggestions}
                      className="text-purple-400 hover:text-purple-200 p-1 flex-shrink-0"
                      aria-label="Dismiss suggestions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Practice suggestions banner */}
              {showPracticeSuggestions && suggestedPractices.length > 0 && (
                <div className="mt-6 bg-teal-900/20 border border-teal-800/40 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-teal-200 mb-3">
                          A practice that might help right now:
                        </p>
                        <div className="space-y-2">
                          {suggestedPractices.map(practice => (
                            <a
                              key={practice.slug}
                              href={`/practices/${practice.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-teal-800/30 hover:bg-teal-800/50 border border-teal-700/40 rounded-lg p-3 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-medium text-teal-100">{practice.title}</h4>
                                  <p className="text-xs text-teal-300/80 mt-0.5">{practice.relevance}</p>
                                </div>
                                <span className="text-xs text-teal-400 whitespace-nowrap">{practice.duration}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={dismissPracticeSuggestions}
                      className="text-teal-400 hover:text-teal-200 p-1 flex-shrink-0"
                      aria-label="Dismiss practice suggestions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Article suggestions banner */}
              {showArticleSuggestions && suggestedArticles.length > 0 && (
                <div className="mt-6 bg-amber-900/20 border border-amber-800/40 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-amber-200 mb-3">
                          You might find these articles helpful:
                        </p>
                        <div className="space-y-2">
                          {suggestedArticles.map(article => (
                            <a
                              key={article.slug}
                              href={`/articles/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-amber-800/30 hover:bg-amber-800/50 border border-amber-700/40 rounded-lg p-3 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-medium text-amber-100">{article.title}</h4>
                                  <p className="text-xs text-amber-300/80 mt-0.5">{article.relevance}</p>
                                </div>
                                <span className="text-xs text-amber-400 whitespace-nowrap">{article.readingTime}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={dismissArticleSuggestions}
                      className="text-amber-400 hover:text-amber-200 p-1 flex-shrink-0"
                      aria-label="Dismiss article suggestions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Error */}
      {error && (
        <div className="fixed bottom-24 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
              <span>{error}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {failedMessage && (
                  <button
                    onClick={retryFailedMessage}
                    className="px-3 py-1 bg-red-800 hover:bg-red-700 text-red-100 rounded text-xs font-medium transition-colors"
                  >
                    Retry
                  </button>
                )}
                <button onClick={() => { setError(null); setFailedMessage(null); }} className="text-red-300 hover:text-white p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-3 bg-zinc-900 border rounded-2xl p-2 ${inputDisabled ? 'border-zinc-800' : 'border-zinc-700'}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loadingHistory ? "Loading conversation..." : "Type your message..."}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none px-3 py-2 focus:outline-none text-sm max-h-[200px] disabled:opacity-50"
              disabled={inputDisabled}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || inputDisabled}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-gray-600 text-xs">
              Press Enter to send, Shift+Enter for new line
            </p>
            {input.length > 0 && (
              <p className="text-gray-600 text-xs">
                ~{estimatedTokens} tokens
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSummary} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Conversation Insights</h2>
                  <p className="text-sm text-gray-500">AI-generated summary of your conversation</p>
                </div>
              </div>
              <button
                onClick={closeSummary}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">Analyzing your conversation...</p>
                  <p className="text-gray-600 text-sm mt-1">This may take a moment</p>
                </div>
              ) : summaryError ? (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
                  <p className="text-red-300">{summaryError}</p>
                  <button
                    onClick={generateSummary}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : summaryContent ? (
                <>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-3 text-gray-300 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-xl font-semibold text-white mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-2 mt-3">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-purple-300">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-400">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-purple-500 pl-4 my-4 italic text-gray-400 bg-purple-900/10 py-2 pr-4 rounded-r">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {summaryContent}
                    </ReactMarkdown>
                  </div>

                  {/* Journaling Prompts Section */}
                  <div className="mt-6 pt-6 border-t border-zinc-700">
                    {journalingPrompts.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Journaling Prompts
                        </h3>
                        <div className="space-y-3">
                          {journalingPrompts.map((item, idx) => (
                            <div key={idx} className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-3">
                              <p className="text-sm text-gray-200">{item.prompt}</p>
                              <p className="text-xs text-amber-400/70 mt-1 capitalize">{item.focus}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={generateJournalingPrompts}
                        disabled={loadingPrompts}
                        className="w-full py-3 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/40 rounded-lg text-sm text-amber-200 transition-colors flex items-center justify-center gap-2"
                      >
                        {loadingPrompts ? (
                          <>
                            <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                            Generating prompts...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Generate journaling prompts
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            {summaryContent && !loadingSummary && (
              <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Based on {messages.length} messages
                  </p>
                  <div className="flex items-center gap-2">
                    {savedToJournal ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-green-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved to journal
                      </span>
                    ) : (
                      <button
                        onClick={saveToJournal}
                        disabled={savingToJournal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg text-sm transition-colors"
                      >
                        {savingToJournal ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Save to Journal
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={closeSummary}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
