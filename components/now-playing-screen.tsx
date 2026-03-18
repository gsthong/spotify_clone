'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';
import { formatTime } from '@/lib/utils';
import {
  ChevronDown, MoreHorizontal,
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX, Heart,
} from 'lucide-react';

export function NowPlayingScreen() {
  const { state, togglePlay, seek, setVolume, nextTrack, previousTrack, toggleMute } = useAudio();
  const { showNowPlaying, closeNowPlaying } = useNowPlaying();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [albumKey, setAlbumKey] = useState(0);

  useEffect(() => { setAlbumKey(k => k + 1); }, [state.currentTrack?.id]);

  const duration = state.currentTrack?.duration ?? 0;
  const progressPercent = duration > 0 ? Math.min(100, (state.currentTime / duration) * 100) : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
  }, [duration, seek]);

  if (!state.currentTrack) return null;

  // Spotify full-screen player style
  return (
    <AnimatePresence>
      {showNowPlaying && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        >
          {/* Background — blurred album art, Spotify style */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${state.currentTrack.albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) brightness(0.4)',
              transform: 'scale(1.3)',
            }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-8 pt-6 pb-10 max-w-lg mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <motion.button onClick={closeNowPlaying} whileTap={{ scale: 0.9 }}>
                <ChevronDown size={24} color="white" />
              </motion.button>
              <div className="text-center">
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Playing from
                </p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Your Library</p>
              </div>
              <button>
                <MoreHorizontal size={24} color="white" />
              </button>
            </div>

            {/* Album art */}
            <motion.div
              key={albumKey}
              className="flex justify-center mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={state.currentTrack.albumArt}
                alt=""
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                }}
              />
            </motion.div>

            {/* Track info + heart */}
            <div className="flex items-center justify-between mb-6">
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {state.currentTrack.title}
                </p>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  {state.currentTrack.artist}
                </p>
              </div>
              <motion.button
                onClick={() => setIsFavorite(f => !f)}
                whileTap={{ scale: 0.85 }}
                style={{ color: isFavorite ? 'var(--sp-green)' : 'rgba(255,255,255,0.6)', flexShrink: 0, marginLeft: '16px' }}
              >
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="relative flex items-center cursor-pointer"
                style={{ height: '20px', marginBottom: '4px' }}
              >
                <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div
                  className="absolute rounded-full"
                  style={{ height: '4px', width: `${progressPercent}%`, backgroundColor: 'white', transition: 'width 0.1s linear' }}
                />
                <div
                  className="absolute w-3 h-3 rounded-full"
                  style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)', backgroundColor: 'white' }}
                />
              </div>
              <div className="flex justify-between" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-8">
              <button style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Shuffle size={22} strokeWidth={1.5} />
              </button>
              <motion.button onClick={previousTrack} whileTap={{ scale: 0.9 }} style={{ color: 'white' }}>
                <SkipBack size={28} fill="white" strokeWidth={0} />
              </motion.button>
              <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.94 }}
                className="flex items-center justify-center rounded-full"
                style={{ width: '64px', height: '64px', backgroundColor: 'white', color: 'black' }}
              >
                {state.isPlaying
                  ? <Pause size={26} fill="black" strokeWidth={0} />
                  : <Play size={26} fill="black" strokeWidth={0} style={{ marginLeft: '3px' }} />}
              </motion.button>
              <motion.button onClick={nextTrack} whileTap={{ scale: 0.9 }} style={{ color: 'white' }}>
                <SkipForward size={28} fill="white" strokeWidth={0} />
              </motion.button>
              <button style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Repeat size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button onClick={toggleMute} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                {state.isMuted || state.volume === 0
                  ? <VolumeX size={18} strokeWidth={1.5} />
                  : <Volume2 size={18} strokeWidth={1.5} />}
              </button>
              <div
                className="flex-1 relative flex items-center cursor-pointer"
                style={{ height: '20px' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                }}
              >
                <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div
                  className="absolute rounded-full"
                  style={{ height: '4px', width: `${(state.isMuted ? 0 : state.volume) * 100}%`, backgroundColor: 'white' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}