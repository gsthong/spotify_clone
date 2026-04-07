'use client';

import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';
import { formatTime } from '@/lib/utils';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX,
  Heart, Maximize2, ListMusic, Radio,
} from 'lucide-react';
import { MoodShuffleBar } from './mood-shuffle-bar';
import { VibeTooltip } from './vibe-tooltip';
import { FrequencyVisualizer } from './frequency-visualizer';

function ProgressBar({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current || !max) return;
    const rect = ref.current.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * max);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center cursor-pointer group"
      style={{ height: '16px', flex: 1 }}
    >
      {/* Track bg */}
      <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
      {/* Fill */}
      <div
        className="absolute rounded-full transition-all duration-100"
        style={{
          height: '4px',
          width: `${pct}%`,
          backgroundColor: hovered ? 'var(--sp-green)' : 'white',
          boxShadow: hovered ? '0 0 12px var(--sp-green)' : 'none',
        }}
      />
      {/* Thumb — show on hover */}
      <div
        className="absolute rounded-full"
        style={{
          width: '12px', height: '12px',
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s, transform 0.15s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          scale: hovered ? 1.2 : 1,
        }}
      />
    </div>
  );
}

function VolumeBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const pct = value * 100;

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center cursor-pointer"
      style={{ height: '16px', width: '90px' }}
    >
      <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
      <div
        className="absolute rounded-full"
        style={{
          height: '4px', width: `${pct}%`,
          backgroundColor: hovered ? '#1db954' : 'white',
          transition: 'background-color 0.1s',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '12px', height: '12px',
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      />
    </div>
  );
}

function CtrlBtn({ children, onClick, active, tooltip }: any) {
  const btn = (
    <button
      onClick={onClick}
      style={{ color: active ? 'var(--sp-green)' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', lineHeight: 0 }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'white'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
      className="hover:scale-110 active:scale-95"
    >
      {children}
    </button>
  );

  if (tooltip) {
    return <VibeTooltip content={tooltip}>{btn}</VibeTooltip>;
  }

  return btn;
}

export function PlayerBar() {
  const { state, togglePlay, seek, setVolume, nextTrack, previousTrack, toggleMute, toggleRadio, smartShuffle } = useAudio();
  const { openNowPlaying } = useNowPlaying();
  const [isFavorite, setIsFavorite] = useState(false);

  const duration = state.currentTrack?.duration ?? 0;

  return (
    <div
      className="glass flex items-center px-4"
      style={{
        height: '90px',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* LEFT — track info (30%) */}
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
            <div style={{ minWidth: 0 }}>
              <p
                onClick={openNowPlaying}
                style={{
                  fontSize: '13px', fontWeight: 500, color: 'white',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '140px', cursor: 'pointer',
                  transition: 'text-decoration 0.1s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
              >
                {state.currentTrack.title}
              </p>
              <p style={{ fontSize: '11px', color: '#b3b3b3', marginTop: '2px' }}>
                {state.currentTrack.artist}
              </p>
              {/* Mini Visualizer */}
              {state.isPlaying && (
                <div className="h-2 w-12 mt-1 opacity-60">
                  <FrequencyVisualizer 
                    barColor={state.accentColor} 
                    barWidth={2} 
                    gap={1} 
                    sensitivity={0.8}
                  />
                </div>
              )}
            </div>
            <motion.button
              onClick={() => setIsFavorite(f => !f)}
              whileTap={{ scale: 0.85 }}
              style={{ color: isFavorite ? '#1db954' : '#b3b3b3', flexShrink: 0, marginLeft: '4px' }}
              onMouseEnter={e => { if (!isFavorite) (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { if (!isFavorite) (e.currentTarget as HTMLElement).style.color = '#b3b3b3'; }}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </motion.button>
          </>
        ) : (
          <div style={{ width: '56px', height: '56px', borderRadius: '4px', backgroundColor: '#282828' }} />
        )}
      </div>

      {/* CENTER — controls + progress (40%) */}
      <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
        <div className="flex items-center gap-4 w-full justify-center">
          <MoodShuffleBar />
          {/* Buttons */}
          <div className="flex items-center gap-5">
            <CtrlBtn
              onClick={() => smartShuffle(null)}
              active={state.shuffleMood === null && state.queue.length > 0}
              tooltip="Shuffle"
            >
              <Shuffle size={16} strokeWidth={2} />
            </CtrlBtn>

          <VibeTooltip content="Previous">
            <motion.button
              onClick={previousTrack}
              whileTap={{ scale: 0.9 }}
              className="hover:scale-110 transition-transform"
              style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
            >
              <SkipBack size={20} fill="currentColor" strokeWidth={0} />
            </motion.button>
          </VibeTooltip>

          <VibeTooltip content={state.isPlaying ? "Pause" : "Play"}>
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center rounded-full hover:scale-105 transition-transform"
              style={{
                width: '40px', height: '40px',
                backgroundColor: 'white',
                flexShrink: 0,
                boxShadow: '0 4px 20px rgba(255,255,255,0.3)',
              }}
            >
              {state.isPlaying
                ? <Pause size={18} fill="black" strokeWidth={0} />
                : <Play size={18} fill="black" strokeWidth={0} style={{ marginLeft: '2px' }} />}
            </motion.button>
          </VibeTooltip>

          <VibeTooltip content="Next">
            <motion.button
              onClick={nextTrack}
              whileTap={{ scale: 0.9 }}
              className="hover:scale-110 transition-transform"
              style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
            >
              <SkipForward size={20} fill="currentColor" strokeWidth={0} />
            </motion.button>
          </VibeTooltip>

          <CtrlBtn tooltip="Repeat"><Repeat size={16} strokeWidth={2} /></CtrlBtn>
          <CtrlBtn 
            onClick={toggleRadio} 
            active={state.radioMode}
            tooltip="Radio Mode"
          >
            <Radio size={16} strokeWidth={2} />
          </CtrlBtn>
        </div>
      </div>

        {/* Progress */}
        <div className="flex items-center gap-2" style={{ width: '100%', maxWidth: '520px' }}>
          <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '32px', textAlign: 'right' }}>
            {formatTime(state.currentTime)}
          </span>
          <ProgressBar value={state.currentTime} max={duration} onChange={seek} />
          <span style={{ fontSize: '11px', color: '#b3b3b3', minWidth: '32px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT — volume (30%) */}
      <div className="flex items-center justify-end gap-3" style={{ width: '30%' }}>
        <CtrlBtn><ListMusic size={16} strokeWidth={1.5} /></CtrlBtn>

        <CtrlBtn onClick={toggleMute}>
          {state.isMuted || state.volume === 0
            ? <VolumeX size={16} strokeWidth={1.5} />
            : <Volume2 size={16} strokeWidth={1.5} />}
        </CtrlBtn>

        <VolumeBar
          value={state.isMuted ? 0 : state.volume}
          onChange={setVolume}
        />

        <CtrlBtn onClick={openNowPlaying}>
          <Maximize2 size={14} strokeWidth={1.5} />
        </CtrlBtn>
      </div>
    </div>
  );
}