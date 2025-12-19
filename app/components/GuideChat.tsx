'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Stance } from '@/lib/presence';
import dynamic from 'next/dynamic';

// Dynamic import for 3D avatar (client-side only, WebGL)
const Avatar3D = dynamic(() => import('./Avatar3D'), { ssr: false });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  stance?: Stance;
}

interface BlendshapeFrame {
  time: number;
  blendshapes: Record<string, number>;
}

interface AudioQueueItem {
  audio: string; // base64
  format: string; // 'mp3' or 'wav'
  text: string;
  words: string[];
  blendshapes?: BlendshapeFrame[];
  video?: string; // base64 mp4 video
}

const STORAGE_KEY = 'guide-chat-messages';

const SUGGESTED_PROMPTS = [
  "I've been feeling stuck lately",
  "Help me understand my shadow",
  "What archetype am I living from?",
];

// Max words to show in caption sliding window
const MAX_CAPTION_WORDS = 12;

// Bridge server URL for speech + blendshapes
const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_SERVER_URL || 'http://127.0.0.1:8768';

/**
 * Real-time Guide Chat with 3D Avatar
 */
export default function GuideChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStance, setCurrentStance] = useState<Stance>('companion');
  const [error, setError] = useState<string | null>(null);
  const [displayedCaption, setDisplayedCaption] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentBlendshapes, setCurrentBlendshapes] = useState<BlendshapeFrame[]>([]);
  const [isPlayingBlendshapes, setIsPlayingBlendshapes] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);

  // Audio queue system
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const currentVideoUrlRef = useRef<string | null>(null);

  // Caption animation
  const captionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordsRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);

  // Sentence buffer for streaming
  const sentenceBufferRef = useRef('');
  const processedTextRef = useRef('');

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      if (currentVideoUrlRef.current) {
        URL.revokeObjectURL(currentVideoUrlRef.current);
      }
    };
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          const lastAi = [...parsed].reverse().find(m => m.role === 'assistant');
          if (lastAi) {
            const words = lastAi.content.split(/\s+/);
            setDisplayedCaption(words.slice(-MAX_CAPTION_WORDS).join(' '));
          }
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Caption animation function
  const startCaptionAnimation = useCallback((words: string[], duration: number) => {
    if (captionIntervalRef.current) {
      clearInterval(captionIntervalRef.current);
    }

    currentWordsRef.current = words;
    wordIndexRef.current = 0;

    const intervalMs = Math.max(50, (duration * 1000) / words.length);

    captionIntervalRef.current = setInterval(() => {
      wordIndexRef.current += 1;
      const idx = wordIndexRef.current;

      const startIdx = Math.max(0, idx - MAX_CAPTION_WORDS);
      const visibleWords = currentWordsRef.current.slice(startIdx, idx);
      setDisplayedCaption(visibleWords.join(' '));

      if (idx >= currentWordsRef.current.length) {
        if (captionIntervalRef.current) {
          clearInterval(captionIntervalRef.current);
          captionIntervalRef.current = null;
        }
      }
    }, intervalMs);
  }, []);

  // Generate speech with blendshapes/video from bridge server
  const generateSpeechWithBlendshapes = useCallback(async (text: string): Promise<{
    audio: string;
    format: string;
    blendshapes: BlendshapeFrame[];
    video?: string;
  } | null> => {
    try {
      // Try bridge server first (includes video or blendshapes)
      // Disable video mode for now - MuseTalk is too slow for real-time
      const response = await fetch(`${BRIDGE_SERVER_URL}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, video: false }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          audio: data.audio,
          format: 'wav',
          blendshapes: data.blendshapes?.frames || [],
          video: data.video, // May be undefined if MuseTalk not available
        };
      }
    } catch (err) {
      console.log('Bridge server not available, falling back to TTS API');
    }

    // Fallback to regular TTS API (no blendshapes or video)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('TTS error:', await response.text());
        return null;
      }

      const data = await response.json();
      if (!data.audio) return null;

      // Generate simple blendshapes for lip sync
      const duration = data.duration || 2;
      const blendshapes = generateSimpleBlendshapes(duration);

      return {
        audio: data.audio,
        format: data.format || 'wav',
        blendshapes,
      };
    } catch (err) {
      console.error('TTS fetch error:', err);
      return null;
    }
  }, []);

  // Generate simple blendshapes when Audio2Face is not available
  const generateSimpleBlendshapes = (duration: number): BlendshapeFrame[] => {
    const fps = 30;
    const numFrames = Math.ceil(duration * fps);
    const frames: BlendshapeFrame[] = [];

    for (let i = 0; i < numFrames; i++) {
      const t = i / fps;
      // Simulate talking with varying jaw open
      const jawOpen = 0.3 + 0.2 * Math.sin(t * 15) * (1 + 0.5 * Math.sin(t * 3));

      frames.push({
        time: t,
        blendshapes: {
          jawOpen: Math.max(0, Math.min(1, jawOpen)),
          mouthClose: 0.3 - jawOpen * 0.3,
        },
      });
    }

    return frames;
  };

  // Play next audio/video in queue - defined as regular function, uses ref
  const playNextInQueueRef = useRef<() => void>(() => {});

  playNextInQueueRef.current = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0) {
        setIsSpeaking(false);
        setIsPlayingBlendshapes(false);
        setCurrentBlendshapes([]);
        setIsVideoMode(false);
        setCurrentVideoUrl(null);
      }
      return;
    }

    const item = audioQueueRef.current.shift()!;
    isPlayingRef.current = true;
    setIsSpeaking(true);

    // Check if we have video (MuseTalk)
    if (item.video) {
      // Video mode - play video with embedded audio
      setIsVideoMode(true);

      // Convert base64 video to blob
      const videoBytes = atob(item.video);
      const videoArray = new Uint8Array(videoBytes.length);
      for (let i = 0; i < videoBytes.length; i++) {
        videoArray[i] = videoBytes.charCodeAt(i);
      }
      const videoBlob = new Blob([videoArray], { type: 'video/mp4' });

      // Clean up previous video URL
      if (currentVideoUrlRef.current) {
        URL.revokeObjectURL(currentVideoUrlRef.current);
      }

      const videoUrl = URL.createObjectURL(videoBlob);
      currentVideoUrlRef.current = videoUrl;
      setCurrentVideoUrl(videoUrl);

      // Also prepare audio for playback (video has no audio, need to sync)
      const audioBytes = atob(item.audio);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      const mimeType = item.format === 'wav' ? 'audio/wav' : 'audio/mp3';
      const audioBlob = new Blob([audioArray], { type: mimeType });

      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudioUrlRef.current = audioUrl;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;

      // Start caption animation and video when audio starts
      audioRef.current.onplay = () => {
        startCaptionAnimation(item.words, audioRef.current?.duration || 2);
        // Start video playback
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(console.error);
        }
      };

      audioRef.current.onended = () => {
        isPlayingRef.current = false;
        setIsVideoMode(false);
        playNextInQueueRef.current();
      };

      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        isPlayingRef.current = false;
        setIsVideoMode(false);
        playNextInQueueRef.current();
      };

      audioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
        isPlayingRef.current = false;
        setIsVideoMode(false);
        playNextInQueueRef.current();
      });

    } else {
      // Blendshape mode - use 2D avatar with blendshapes
      setIsVideoMode(false);

      // Set blendshapes for animation
      if (item.blendshapes && item.blendshapes.length > 0) {
        setCurrentBlendshapes(item.blendshapes);
        setIsPlayingBlendshapes(true);
      }

      // Convert base64 to blob
      const audioBytes = atob(item.audio);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      const mimeType = item.format === 'wav' ? 'audio/wav' : 'audio/mp3';
      const blob = new Blob([audioArray], { type: mimeType });

      // Clean up previous URL
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(blob);
      currentAudioUrlRef.current = audioUrl;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;

      // Start caption animation when audio starts
      audioRef.current.onplay = () => {
        startCaptionAnimation(item.words, audioRef.current?.duration || 2);
      };

      audioRef.current.onended = () => {
        isPlayingRef.current = false;
        setIsPlayingBlendshapes(false);
        playNextInQueueRef.current();
      };

      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        isPlayingRef.current = false;
        setIsPlayingBlendshapes(false);
        playNextInQueueRef.current();
      };

      audioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
        isPlayingRef.current = false;
        setIsPlayingBlendshapes(false);
        playNextInQueueRef.current();
      });
    }
  };

  // Queue a sentence for TTS
  const queueSentence = useCallback(async (sentence: string) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return;

    const result = await generateSpeechWithBlendshapes(trimmed);

    if (result) {
      audioQueueRef.current.push({
        audio: result.audio,
        format: result.format,
        text: trimmed,
        words,
        blendshapes: result.blendshapes,
        video: result.video, // Include video if available
      });

      // Start playing if not already
      if (!isPlayingRef.current) {
        playNextInQueueRef.current();
      }
    }
  }, [generateSpeechWithBlendshapes]);

  // Extract complete sentences from buffer
  const extractSentences = useCallback((text: string): { sentences: string[], remainder: string } => {
    const sentenceEndings = /[.!?:]\s+|[.!?:]$/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceEndings.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + 1).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }

    const remainder = text.slice(lastIndex);
    return { sentences, remainder };
  }, []);

  // Process streamed text
  const processStreamedText = useCallback((fullText: string) => {
    const newText = fullText.slice(processedTextRef.current.length);
    sentenceBufferRef.current += newText;
    processedTextRef.current = fullText;

    const { sentences, remainder } = extractSentences(sentenceBufferRef.current);
    sentenceBufferRef.current = remainder;

    for (const sentence of sentences) {
      queueSentence(sentence);
    }
  }, [extractSentences, queueSentence]);

  // Flush remaining text
  const flushRemainingText = useCallback(() => {
    if (sentenceBufferRef.current.trim()) {
      queueSentence(sentenceBufferRef.current);
      sentenceBufferRef.current = '';
    }
  }, [queueSentence]);

  const clearConversation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    if (captionIntervalRef.current) {
      clearInterval(captionIntervalRef.current);
      captionIntervalRef.current = null;
    }

    sentenceBufferRef.current = '';
    processedTextRef.current = '';

    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStance('companion');
    setError(null);
    setDisplayedCaption('');
    setIsSpeaking(false);
    setCurrentBlendshapes([]);
    setIsPlayingBlendshapes(false);
    setIsVideoMode(false);
    setCurrentVideoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    if (captionIntervalRef.current) {
      clearInterval(captionIntervalRef.current);
      captionIntervalRef.current = null;
    }

    sentenceBufferRef.current = '';
    processedTextRef.current = '';
    setDisplayedCaption('');
    setIsSpeaking(false);
    setCurrentBlendshapes([]);
    setIsPlayingBlendshapes(false);
    setIsVideoMode(false);
    setCurrentVideoUrl(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessage = '';
      let newStance: Stance = 'companion';

      setMessages(prev => [...prev, { role: 'assistant', content: '', stance: newStance }]);

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.content) {
                assistantMessage += data.content;

                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                    stance: newStance,
                  };
                  return updated;
                });

                // Process TTS for 3D avatar lip sync
                processStreamedText(assistantMessage);
              }

              if (data.done && data.stance) {
                newStance = data.stance;
                setCurrentStance(data.stance);
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    stance: data.stance,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Flush remaining TTS
      flushRemainingText();

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-12 pb-32 overflow-hidden">
        {/* Avatar section - Video or 3D avatar - full height behind chat */}
        <div className="absolute inset-0 w-full h-full">
          {/* Video avatar when MuseTalk video is available */}
          {isVideoMode && currentVideoUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                ref={videoRef}
                src={currentVideoUrl}
                className="max-h-full max-w-full rounded-2xl"
                muted
                playsInline
                loop={false}
              />
            </div>
          ) : (
            /* 2D Avatar fallback with blendshapes */
            <Avatar3D
              
              audioElement={audioRef.current}
              isSpeaking={isSpeaking}
              
            />
          )}

        </div>

        {/* Chat history - floating messages with fade at top */}
        {messages.length > 0 && (
          <div className="absolute bottom-28 left-0 right-0 z-20 pointer-events-none">
            {/* Scrollable message area with CSS mask for fade */}
            <div
              className="max-h-52 overflow-y-auto px-6 pointer-events-auto scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)'
              }}
            >
              <div className="flex flex-col gap-3 max-w-2xl mx-auto pt-12 pb-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white/10 backdrop-blur-md text-white/90 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">
                        {msg.role === 'assistant' && idx === messages.length - 1 && isSpeaking && displayedCaption
                          ? displayedCaption
                          : msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested prompts - floating at bottom above input */}
        {messages.length === 0 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 max-w-xl px-4 z-20">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="px-4 py-2 text-white/60 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full hover:bg-black/60 hover:border-white/30 hover:text-white transition-all text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 px-6 py-3 rounded-lg text-red-200 text-sm backdrop-blur-sm z-50">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-6 px-4 z-30">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none resize-none min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 font-medium"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
