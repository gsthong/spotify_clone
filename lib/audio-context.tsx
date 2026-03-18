'use client';

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { AudioState, Track } from './types';

interface AudioContextType {
  state: AudioState;
  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  setAccentColor: (color: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    currentTrack: null,
    queue: [],
    currentQueueIndex: 0,
    isPlaying: false,
    currentTime: 0,
    volume: 0.7,
    isMuted: false,
    accentColor: '#c084fc',
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Use ref for queue/index so callbacks always see latest values (avoid stale closure)
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { queueRef.current = state.queue; }, [state.queue]);
  useEffect(() => { queueIndexRef.current = state.currentQueueIndex; }, [state.currentQueueIndex]);
  useEffect(() => { isPlayingRef.current = state.isPlaying; }, [state.isPlaying]);

  const playAudioSrc = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = () => {
      audio.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[audio] play error:', err);
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      });
    };
    if (audio.readyState >= 2) {
      attempt();
    } else {
      audio.addEventListener('canplay', attempt, { once: true });
    }
  }, []);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      // Use refs to avoid stale closure
      const queue = queueRef.current;
      const idx = queueIndexRef.current;
      const nextIndex = (idx + 1) % queue.length;
      const next = queue[nextIndex];
      if (next) {
        audio.src = next.url;
        audio.currentTime = 0;
        playAudioSrc();
        setState(prev => ({
          ...prev,
          currentTrack: next,
          currentQueueIndex: nextIndex,
          currentTime: 0,
          isPlaying: true,
        }));
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [playAudioSrc]);

  const play = useCallback((track?: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track) {
      audio.pause();
      audio.src = track.url;
      audio.currentTime = 0;
      setState(prev => ({
        ...prev,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
      }));
      playAudioSrc();
    } else if (audio.paused) {
      audio.play().catch(() => {});
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [playAudioSrc]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const v = Math.max(0, Math.min(1, volume));
    if (audioRef.current) audioRef.current.volume = v;
    setState(prev => ({ ...prev, volume: v }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted;
      if (audioRef.current) audioRef.current.volume = newMuted ? 0 : prev.volume;
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const nextTrack = useCallback(() => {
    const audio = audioRef.current;
    const queue = queueRef.current;
    const idx = queueIndexRef.current;
    const nextIndex = (idx + 1) % queue.length;
    const next = queue[nextIndex];
    if (!next || !audio) return;

    audio.pause();
    audio.src = next.url;
    audio.currentTime = 0;

    setState(prev => ({
      ...prev,
      currentTrack: next,
      currentQueueIndex: nextIndex,
      currentTime: 0,
    }));

    if (isPlayingRef.current) playAudioSrc();
  }, [playAudioSrc]);

  const previousTrack = useCallback(() => {
    const audio = audioRef.current;
    const queue = queueRef.current;
    const idx = queueIndexRef.current;

    // If >3s in, restart; else go to previous
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setState(prev => ({ ...prev, currentTime: 0 }));
      return;
    }

    const prevIndex = idx === 0 ? queue.length - 1 : idx - 1;
    const prev_ = queue[prevIndex];
    if (!prev_ || !audio) return;

    audio.pause();
    audio.src = prev_.url;
    audio.currentTime = 0;

    setState(prev => ({
      ...prev,
      currentTrack: prev_,
      currentQueueIndex: prevIndex,
      currentTime: 0,
    }));

    if (isPlayingRef.current) playAudioSrc();
  }, [playAudioSrc]);

  const setQueue = useCallback((tracks: Track[], startIndex = 0) => {
    const track = tracks[startIndex] || null;
    const audio = audioRef.current;
    if (audio && track) {
      audio.src = track.url;
    }
    setState(prev => ({
      ...prev,
      queue: tracks,
      currentTrack: track,
      currentQueueIndex: startIndex,
      currentTime: 0,
    }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(prev => ({ ...prev, queue: [...prev.queue, track] }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState(prev => {
      const newQueue = prev.queue.filter((_, i) => i !== index);
      return {
        ...prev,
        queue: newQueue,
        currentQueueIndex: prev.currentQueueIndex > index
          ? prev.currentQueueIndex - 1
          : prev.currentQueueIndex,
      };
    });
  }, []);

  // FIX: was setting '--accent-color' instead of '--color-accent'
  const setAccentColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, accentColor: color }));
    document.documentElement.style.setProperty('--color-accent', color);
  }, []);

  return (
    <AudioContext.Provider value={{
      state, play, pause, togglePlay, seek, setVolume, toggleMute,
      nextTrack, previousTrack, setQueue, addToQueue, removeFromQueue, setAccentColor,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
