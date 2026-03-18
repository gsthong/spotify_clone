'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';

const TAB_BAR_H = 64;

export function MobileMiniPlayer() {
  const { state, togglePlay, nextTrack } = useAudio();
  const { openNowPlaying } = useNowPlaying();
  const { currentTrack, isPlaying, currentTime } = state;

  if (!currentTrack) return null;

  const duration = currentTrack.duration ?? 0;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        key={currentTrack.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: `calc(${TAB_BAR_H}px + env(safe-area-inset-bottom) + 8px)`,
          left: '8px',
          right: '8px',
          height: '64px',
          backgroundColor: '#282828',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 10px 0 8px',
          zIndex: 39,
          overflow: 'hidden',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={openNowPlaying}
      >
        {/* Album art */}
        <motion.img
          layoutId="mobile-album-art"
          src={currentTrack.albumArt}
          alt=""
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />

        {/* Title + artist + progress */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.title}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTrack.artist}
          </p>
          {/* Progress bar */}
          <div
            style={{
              marginTop: '4px',
              height: '2px',
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '1px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '2px',
                width: `${progressPercent}%`,
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'width 0.5s linear',
              }}
            />
          </div>
        </div>

        {/* Play / Pause */}
        <motion.button
          onClick={e => { e.stopPropagation(); togglePlay(); }}
          whileTap={{ scale: 0.88 }}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'white',
          }}
        >
          {isPlaying
            ? <Pause size={22} fill="white" strokeWidth={0} />
            : <Play size={22} fill="white" strokeWidth={0} style={{ marginLeft: '2px' }} />}
        </motion.button>

        {/* Next */}
        <motion.button
          onClick={e => { e.stopPropagation(); nextTrack(); }}
          whileTap={{ scale: 0.88 }}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <SkipForward size={20} strokeWidth={1.5} />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
