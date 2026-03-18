'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export function MiniPlayer() {
  const { state, togglePlay, nextTrack, previousTrack } = useAudio();
  const { openNowPlaying } = useNowPlaying();

  if (!state.currentTrack) return null;

  const progressPercent = state.currentTrack.duration > 0
    ? Math.min(100, (state.currentTime / state.currentTrack.duration) * 100)
    : 0;

  return (
    <motion.div
      className="fixed left-0 right-0 z-40"
      style={{ bottom: '56px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="relative flex items-center px-4 cursor-pointer"
        style={{
          backgroundColor: 'rgba(8, 8, 8, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          height: '64px',
        }}
        onClick={openNowPlaying}
      >
        {/* Album art */}
        <motion.img
          src={state.currentTrack.albumArt}
          alt={state.currentTrack.title}
          layoutId="album-art-thumb"
          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0 mx-3">
          <p className="font-display line-clamp-1" style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>
            {state.currentTrack.title}
          </p>
          <p className="font-mono line-clamp-1" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
            {state.currentTrack.artist}
          </p>
        </div>

        {/* Prev */}
        <motion.button
          onClick={e => { e.stopPropagation(); previousTrack(); }}
          whileTap={{ scale: 0.9 }}
          className="p-2 flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <SkipBack size={18} strokeWidth={1.5} />
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          onClick={e => { e.stopPropagation(); togglePlay(); }}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 flex items-center justify-center mx-2"
          style={{ color: 'var(--color-accent)' }}
        >
          {state.isPlaying
            ? <Pause size={20} strokeWidth={1.5} fill="currentColor" />
            : <Play size={20} strokeWidth={1.5} fill="currentColor" />}
        </motion.button>

        {/* Next */}
        <motion.button
          onClick={e => { e.stopPropagation(); nextTrack(); }}
          whileTap={{ scale: 0.9 }}
          className="p-2 flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <SkipForward size={18} strokeWidth={1.5} />
        </motion.button>

        {/* Progress line at very bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--color-accent)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </motion.div>
  );
}
