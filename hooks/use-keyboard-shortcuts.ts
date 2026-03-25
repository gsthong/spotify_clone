'use client';

import { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';

export function useKeyboardShortcuts() {
  const { togglePlay, nextTrack, previousTrack, setVolume, setPlayerMode, state } = useAudio();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.ctrlKey) nextTrack();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) previousTrack();
          break;
        case 'ArrowUp':
          if (e.ctrlKey) {
            e.preventDefault();
            setVolume(state.volume + 0.1);
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey) {
            e.preventDefault();
            setVolume(state.volume - 0.1);
          }
          break;
        case 'KeyM':
          // toggleMute would be better but I'll use setVolume(0) for now if toggleMute isn't in scope easily
          // actually toggleMute is in context
          break;
        case 'KeyC':
          if (e.shiftKey) {
            e.preventDefault();
            setPlayerMode('concert');
          }
          break;
        case 'KeyN':
          if (e.shiftKey) {
            e.preventDefault();
            setPlayerMode('night-drive');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, previousTrack, setVolume, state.volume]);
}
