'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Stance } from '@/lib/presence';

interface VideoAvatarProps {
  stance: Stance;
  textToSpeak?: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onSpeakingComplete?: () => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Video-based avatar with real-time lip sync.
 * Connects to the avatar pipeline WebSocket server for TTS + lip sync.
 */
export default function VideoAvatar({
  stance,
  textToSpeak,
  onSpeakingChange,
  onSpeakingComplete,
}: VideoAvatarProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [idleVideoUrl, setIdleVideoUrl] = useState('/videos/idle_loop.mp4');

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stance-based ring colors
  const getStanceStyles = () => {
    switch (stance) {
      case 'mirror':
        return {
          ring: 'ring-purple-500/40',
          glow: 'shadow-purple-500/20',
        };
      case 'companion':
        return {
          ring: 'ring-blue-500/40',
          glow: 'shadow-blue-500/20',
        };
      case 'guide':
        return {
          ring: 'ring-amber-500/40',
          glow: 'shadow-amber-500/20',
        };
      case 'anchor':
        return {
          ring: 'ring-emerald-500/40',
          glow: 'shadow-emerald-500/20',
        };
    }
  };

  const styles = getStanceStyles();

  // Connect to avatar pipeline WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');

    const ws = new WebSocket('ws://127.0.0.1:8768');

    ws.onopen = () => {
      console.log('Avatar pipeline connected');
      setConnectionStatus('connected');
      // Check status
      ws.send(JSON.stringify({ action: 'status' }));
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);

          if (data.status === 'speaking_start') {
            console.log('Speaking start:', data);
            setIsSpeaking(true);
            onSpeakingChange?.(true);
            frameQueueRef.current = [];
            isPlayingRef.current = true;

            // Hide idle video during speech
            if (videoRef.current) {
              videoRef.current.style.display = 'none';
            }
          } else if (data.status === 'speaking_end') {
            console.log('Speaking end');
            // Wait for frames to finish playing
            setTimeout(() => {
              setIsSpeaking(false);
              onSpeakingChange?.(false);
              onSpeakingComplete?.();
              isPlayingRef.current = false;
              setCurrentFrame(null);

              // Show idle video again
              if (videoRef.current) {
                videoRef.current.style.display = 'block';
                videoRef.current.play();
              }
            }, 500);
          } else if (data.status === 'ready') {
            console.log('Avatar pipeline ready:', data);
          } else if (data.error) {
            console.error('Avatar error:', data.error);
          }
        } catch {
          // Not JSON, ignore
        }
      } else {
        // Binary data - could be audio or video frame
        const blob = event.data as Blob;

        // Check if it's audio (WAV header starts with RIFF)
        const header = await blob.slice(0, 4).text();
        if (header === 'RIFF') {
          // Audio data
          const audioUrl = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        } else {
          // Video frame (JPEG)
          frameQueueRef.current.push(blob);
          playNextFrame();
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setConnectionStatus('disconnected');
      wsRef.current = null;

      // Try to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [onSpeakingChange, onSpeakingComplete]);

  // Play frames from queue
  const playNextFrame = useCallback(() => {
    if (!isPlayingRef.current || frameQueueRef.current.length === 0) return;

    const frame = frameQueueRef.current.shift();
    if (frame) {
      const url = URL.createObjectURL(frame);
      setCurrentFrame(url);

      // Clean up old URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Play next frame at ~30fps
      setTimeout(playNextFrame, 33);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  // Send text to speak when prop changes
  useEffect(() => {
    if (textToSpeak && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending text to avatar:', textToSpeak.substring(0, 50) + '...');
      wsRef.current.send(
        JSON.stringify({
          action: 'speak',
          text: textToSpeak,
          language: 'en',
        })
      );
    }
  }, [textToSpeak]);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar container */}
      <div
        className={`relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full ring-2 ${styles.ring} shadow-xl ${styles.glow} overflow-hidden transition-all duration-500`}
      >
        {/* Idle video (plays when not speaking) */}
        <video
          ref={videoRef}
          src={idleVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: isSpeaking ? 'none' : 'block' }}
        />

        {/* Speaking frame (shows lip-synced frames) */}
        {currentFrame && (
          <img
            src={currentFrame}
            alt="Speaking avatar"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Speaking glow overlay */}
        {isSpeaking && (
          <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
        )}

        {/* Connection status indicator */}
        <div className="absolute bottom-2 right-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : connectionStatus === 'error'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
            title={`Avatar: ${connectionStatus}`}
          />
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Speaking indicator dots */}
      {isSpeaking && (
        <div className="flex gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      )}

      {/* Fallback message if not connected */}
      {connectionStatus === 'error' && (
        <p className="text-xs text-gray-500 mt-2">
          Avatar offline - using text only
        </p>
      )}
    </div>
  );
}
