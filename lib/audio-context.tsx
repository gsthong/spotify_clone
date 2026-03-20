'use client';

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { AudioState, Track, Mood } from './types';
import { useScrobble } from '@/hooks/use-scrobble';
import { db } from './db';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';
const CLIENT_CACHE_TTL_MS = 25 * 60 * 1000;

interface StreamCacheEntry {
  url: string;
  expiresAt: number;
}

interface StreamResponse {
  url: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
}

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
  toggleRadio: () => void;
  smartShuffle: (mood: Mood) => Promise<void>;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// ─── YouTube ID detection ──────────────────────────────────────
function isYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function isAlreadyResolved(url: string): boolean {
  return url.startsWith('http') && (url.includes('googlevideo') || url.includes('youtube'));
}

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
    radioMode: false,
    shuffleMood: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const streamCacheRef = useRef<Map<string, StreamCacheEntry>>(new Map());
  const scrobbleTrackIdRef = useRef<string | null>(null);
  const radioModeRef = useRef(false);

  const { scrobble } = useScrobble();

  useEffect(() => { queueRef.current = state.queue; }, [state.queue]);
  useEffect(() => { queueIndexRef.current = state.currentQueueIndex; }, [state.currentQueueIndex]);
  useEffect(() => { isPlayingRef.current = state.isPlaying; }, [state.isPlaying]);
  useEffect(() => { radioModeRef.current = !!state.radioMode; }, [state.radioMode]);

  // Scrobble watcher
  useEffect(() => {
    const track = state.currentTrack;
    if (!track || !state.isPlaying) return;

    const threshold = Math.min(track.duration * 0.5, 240);
    if (state.currentTime >= threshold && scrobbleTrackIdRef.current !== track.id) {
      scrobbleTrackIdRef.current = track.id;
      scrobble(track.artist, track.title);
    }
  }, [state.currentTime, state.currentTrack, state.isPlaying, scrobble]);

  // ─── Stream URL resolver with client-side cache ──────────────
  const resolveStreamUrl = useCallback(async (youtubeId: string): Promise<string> => {
    const cache = streamCacheRef.current;
    const cached = cache.get(youtubeId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.url;
    }

    try {
      const res = await fetch(`${PROXY_URL}/stream?id=${youtubeId}`);
      if (!res.ok) return '';
      const data: StreamResponse = await res.json();
      if (!data.url) return '';
      cache.set(youtubeId, { url: data.url, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });
      return data.url;
    } catch {
      return '';
    }
  }, []);

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

  // Resolve the effective URL for a track (checks cache, fetches if needed)
  const getPlayableUrl = useCallback(async (track: Track): Promise<string> => {
    if (track.url && isAlreadyResolved(track.url)) return track.url;
    if (track.url && track.url.startsWith('http') && !isYouTubeId(track.id)) return track.url;
    if (isYouTubeId(track.id)) return resolveStreamUrl(track.id);
    return track.url;
  }, [resolveStreamUrl]);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = async () => {
      const queue = queueRef.current;
      const idx = queueIndexRef.current;
      
      // Save to history (Feature 5)
      if (state.currentTrack) {
        db.history.add({
          trackId: state.currentTrack.id,
          playedAt: Date.now(),
          completed: true
        });
        db.tracks.where('id').equals(state.currentTrack.id).modify(t => {
          t.plays = (t.plays || 0) + 1;
        });
      }

      if (queue.length === 0) return;

      // Radio Mode Logic (Feature 2)
      if (radioModeRef.current && idx >= queue.length - 2) {
        try {
          const res = await fetch(`${PROXY_URL}/related?id=${state.currentTrack?.id || queue[idx]?.id}`);
          if (res.ok) {
            const related = await res.json();
            const tracks: Track[] = related.map((r: any) => ({
              ...r,
              album: '',
              albumArt: r.thumbnail,
              url: r.id,
              plays: 0,
              mood: 'hype'
            }));
            if (tracks.length > 0) {
              setState(prev => ({ ...prev, queue: [...prev.queue, ...tracks] }));
              window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { message: `Added ${tracks.length} related tracks`, type: 'success' } }));
            }
          }
        } catch (err) {
          console.error('[radio] error:', err);
        }
      }

      const nextIndex = (idx + 1) % queue.length;
      const next = queue[nextIndex];
      if (!next) return;

      setState(prev => ({
        ...prev,
        currentTrack: next,
        currentQueueIndex: nextIndex,
        currentTime: 0,
        isPlaying: true,
      }));

      const url = await getPlayableUrl(next);
      if (url) {
        audio.src = url;
        audio.currentTime = 0;
        audio.play().catch(() => {});
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
      setState(prev => ({
        ...prev,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
      }));

      (async () => {
        const url = await getPlayableUrl(track);
        if (!url) {
          console.warn('[audio] Could not resolve stream for:', track.id);
          setState(prev => ({ ...prev, isPlaying: false }));
          return;
        }
        audio.src = url;
        audio.currentTime = 0;
        playAudioSrc();
      })();
    } else if (audio.paused) {
      audio.play().catch(() => {});
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [playAudioSrc, getPlayableUrl]);

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

    setState(prev => ({
      ...prev,
      currentTrack: next,
      currentQueueIndex: nextIndex,
      currentTime: 0,
    }));

    (async () => {
      const url = await getPlayableUrl(next);
      if (!url) return;
      audio.src = url;
      audio.currentTime = 0;
      if (isPlayingRef.current) playAudioSrc();
    })();
  }, [playAudioSrc, getPlayableUrl]);

  const previousTrack = useCallback(() => {
    const audio = audioRef.current;
    const queue = queueRef.current;
    const idx = queueIndexRef.current;

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setState(prev => ({ ...prev, currentTime: 0 }));
      return;
    }

    const prevIndex = idx === 0 ? queue.length - 1 : idx - 1;
    const prev_ = queue[prevIndex];
    if (!prev_ || !audio) return;

    audio.pause();

    setState(prev => ({
      ...prev,
      currentTrack: prev_,
      currentQueueIndex: prevIndex,
      currentTime: 0,
    }));

    (async () => {
      const url = await getPlayableUrl(prev_);
      if (!url) return;
      audio.src = url;
      audio.currentTime = 0;
      if (isPlayingRef.current) playAudioSrc();
    })();
  }, [playAudioSrc, getPlayableUrl]);

  const setQueue = useCallback((tracks: Track[], startIndex = 0) => {
    const track = tracks[startIndex] || null;
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

  const toggleRadio = useCallback(() => {
    setState(prev => ({ ...prev, radioMode: !prev.radioMode }));
  }, []);

  const smartShuffle = useCallback(async (mood: Mood) => {
    setState(prev => {
      let newQueue = [...prev.queue];
      const current = prev.currentTrack;
      
      // Filter out current track to re-insert it at 0
      if (current) {
        newQueue = newQueue.filter(t => t.id !== current.id);
      }

      if (!mood) {
        // Fisher-Yates Full Shuffle
        for (let i = newQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }
      } else {
        const moodTracks = newQueue.filter(t => t.mood === mood);
        const otherTracks = newQueue.filter(t => t.mood !== mood);

        if (moodTracks.length < 3) {
          window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { message: `Not enough ${mood} tracks`, type: 'info' } }));
          // Fallback to full shuffle
          for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
          }
        } else {
          // Weighted shuffle for mood tracks (less plays = more likely)
          moodTracks.sort((a, b) => (a.plays || 0) - (b.plays || 0) + (Math.random() * 5 - 2.5));
          newQueue = [...moodTracks, ...otherTracks];
        }
      }

      if (current) {
        newQueue.unshift(current);
      }

      return {
        ...prev,
        queue: newQueue,
        currentQueueIndex: 0,
        shuffleMood: mood
      };
    });
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, accentColor: color }));
    document.documentElement.style.setProperty('--color-accent', color);
  }, []);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    setState(prev => {
      const newQueue = [...prev.queue];
      const [removed] = newQueue.splice(oldIndex, 1);
      newQueue.splice(newIndex, 0, removed);
      
      let newCurrentIndex = prev.currentQueueIndex;
      if (oldIndex === prev.currentQueueIndex) {
        newCurrentIndex = newIndex;
      } else if (oldIndex < prev.currentQueueIndex && newIndex >= prev.currentQueueIndex) {
        newCurrentIndex--;
      } else if (oldIndex > prev.currentQueueIndex && newIndex <= prev.currentQueueIndex) {
        newCurrentIndex++;
      }

      return {
        ...prev,
        queue: newQueue,
        currentQueueIndex: newCurrentIndex
      };
    });
  }, []);

  return (
    <AudioContext.Provider value={{
      state, play, pause, togglePlay, seek, setVolume, toggleMute,
      nextTrack, previousTrack, setQueue, addToQueue, removeFromQueue, setAccentColor,
      toggleRadio, smartShuffle, reorderQueue,
      audioRef,
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
