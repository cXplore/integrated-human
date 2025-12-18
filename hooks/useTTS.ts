import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTTSOptions {
  enabled: boolean;
  voice?: 'female' | 'male';
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useTTS(options: UseTTSOptions) {
  const { enabled, voice = 'female', rate = 1.0, onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Check if browser TTS is available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsAvailable(true);

      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };

      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Get appropriate voice
  const getVoice = useCallback(() => {
    if (voicesRef.current.length === 0) return null;

    // Try to find a voice matching the gender preference
    const preferredVoice = voicesRef.current.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      // Filter to English voices
      if (!lang.startsWith('en')) return false;

      // Filter by gender
      if (voice === 'female') {
        return name.includes('female') || name.includes('woman') ||
               name.includes('samantha') || name.includes('victoria') ||
               name.includes('karen') || name.includes('fiona') ||
               name.includes('zira');
      } else {
        return name.includes('male') || name.includes('man') ||
               name.includes('daniel') || name.includes('alex') ||
               name.includes('fred') || name.includes('david');
      }
    });

    // Fallback to any English voice
    return preferredVoice || voicesRef.current.find(v => v.lang.startsWith('en')) || voicesRef.current[0];
  }, [voice]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!isAvailable || !enabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      onError?.(new Error(event.error));
    };

    window.speechSynthesis.speak(utterance);
  }, [isAvailable, enabled, rate, getVoice, onStart, onEnd, onError]);

  // Stop speaking
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isAvailable,
  };
}
