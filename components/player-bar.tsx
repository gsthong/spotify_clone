'use client';

import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';
import { formatTime } from '@/lib/utils';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX,
  Heart, Maximize2, ListMusic,
} from 'lucide-react';

export function PlayerBar() {
  const { state, togglePlay, seek, setVolume, nextTrack, previousTrack, toggleMute } = useAudio();
  const { openNowPlaying } = useNowPlaying();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const duration = state.currentTrack?.duration ?? 0;
  const progressPercent = duration > 0 ? Math.min(100, (state.currentTime / duration) * 100) : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
  }, [duration, seek]);

  return (
    <div
      className="flex items-center px-4"
      style={{
        height: '90px',
        backgroundColor: 'var(--sp-player)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      {/* LEFT — track info */}
      <div className="flex items-center gap-3" style={{ width: '30%', minWidth: 0 }}>
        {state.currentTrack ? (
          <>
            <motion.img
              src={state.currentTrack.albumArt}
              alt=""
              onClick={openNowPlaying}
              style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
              whileHover={{ scale: 1.02 }}
            />
            <div className="min-w-0">
              <p
                style={{ fontSize: '13px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}
              >
                {state.currentTrack.title}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--sp-text-secondary)', marginTop: '2px' }}>
                {state.currentTrack.artist}
              </p>
            </div>
            <motion.button
              onClick={() => setIsFavorite(f => !f)}
              whileTap={{ scale: 0.85 }}
              style={{ color: isFavorite ? 'var(--sp-green)' : 'var(--sp-text-secondary)', flexShrink: 0, marginLeft: '4px' }}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </motion.button>
          </>
        ) : (
          <div style={{ width: '56px', height: '56px', borderRadius: '4px', backgroundColor: 'var(--sp-bg-highlight)' }} />
        )}
      </div>

      {/* CENTER — controls + progress */}
      <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
        {/* Control buttons */}
        <div className="flex items-center gap-4">
          <button style={{ color: 'var(--sp-text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
          >
            <Shuffle size={16} strokeWidth={1.5} />
          </button>

          <motion.button
            onClick={previousTrack}
            whileTap={{ scale: 0.9 }}
            style={{ color: 'var(--sp-text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
          >
            <SkipBack size={18} strokeWidth={1.5} fill="currentColor" />
          </motion.button>

          {/* Main play button */}
          <motion.button
            onClick={togglePlay}
            whileTap={{ scale: 0.94 }}
            className="flex items-center justify-center rounded-full"
            style={{
              width: '32px', height: '32px',
              backgroundColor: state.currentTrack ? 'white' : 'rgba(255,255,255,0.4)',
              color: 'black',
            }}
          >
            {state.isPlaying
              ? <Pause size={14} fill="currentColor" strokeWidth={0} />
              : <Play size={14} fill="currentColor" strokeWidth={0} style={{ marginLeft: '2px' }} />}
          </motion.button>

          <motion.button
            onClick={nextTrack}
            whileTap={{ scale: 0.9 }}
            style={{ color: 'var(--sp-text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
          >
            <SkipForward size={18} strokeWidth={1.5} fill="currentColor" />
          </motion.button>

          <button style={{ color: 'var(--sp-text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
          >
            <Repeat size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full" style={{ maxWidth: '500px' }}>
          <span style={{ fontSize: '11px', color: 'var(--sp-text-secondary)', minWidth: '30px', textAlign: 'right' }}>
            {formatTime(state.currentTime)}
          </span>

          {/* Track */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 relative flex items-center cursor-pointer group"
            style={{ height: '16px' }}
          >
            <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div
              className="absolute rounded-full"
              style={{
                height: '4px',
                width: `${progressPercent}%`,
                backgroundColor: 'white',
                transition: 'width 0.1s linear',
              }}
            />
            {/* Thumb appears on hover via CSS group */}
            <div
              className="absolute rounded-full"
              style={{
                width: '12px', height: '12px',
                left: `${progressPercent}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            />
          </div>

          <span style={{ fontSize: '11px', color: 'var(--sp-text-secondary)', minWidth: '30px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT — volume + extras */}
      <div className="flex items-center justify-end gap-3" style={{ width: '30%' }}>
        <button style={{ color: 'var(--sp-text-secondary)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
        >
          <ListMusic size={16} strokeWidth={1.5} />
        </button>

        <button
          onClick={toggleMute}
          style={{ color: 'var(--sp-text-secondary)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
        >
          {state.isMuted || state.volume === 0
            ? <VolumeX size={16} strokeWidth={1.5} />
            : <Volume2 size={16} strokeWidth={1.5} />}
        </button>

        {/* Volume slider */}
        <div
          className="relative flex items-center cursor-pointer"
          style={{ width: '90px', height: '16px' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}
        >
          <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div
            className="absolute rounded-full"
            style={{
              height: '4px',
              width: `${(state.isMuted ? 0 : state.volume) * 100}%`,
              backgroundColor: 'white',
            }}
          />
        </div>

        <button
          onClick={openNowPlaying}
          style={{ color: 'var(--sp-text-secondary)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
        >
          <Maximize2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
