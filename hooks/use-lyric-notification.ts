'use client';

import { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { useLyrics } from '@/hooks/use-lyrics';

export function useLyricNotification() {
  const { state } = useAudio();
  const { lines, currentLine } = useLyrics(state.currentTrack, state.currentTime);
  const currentLyricRef = useRef<string | null>(null);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (currentLine === -1 || !lines[currentLine]) return;

    const lyric = lines[currentLine].text;
    if (lyric === currentLyricRef.current) return;
    currentLyricRef.current = lyric;

    if (state.currentTrack) {
      // Use service worker if possible for better background support
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'updateLyric',
          lyric: lyric,
          albumArt: state.currentTrack.albumArt
        });
      } else {
        // Fallback to standard notification
        new Notification('VIBE MUSIC', {
          body: `${lyric}\n${state.currentTrack.title} — ${state.currentTrack.artist}`,
          icon: state.currentTrack.albumArt,
          tag: 'vibe-lyric',
          silent: true,
          requireInteraction: false
        });
      }
    }
  }, [currentLine, lines, state.currentTrack]);
}
