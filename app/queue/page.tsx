'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { Play, X } from 'lucide-react';

export default function QueuePage() {
  const { state, play, removeFromQueue } = useAudio();

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--sp-bg)', padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginBottom: '24px' }}>Queue</h1>

      {state.currentTrack && (
        <div className="mb-8">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Now playing
          </p>
          <div className="flex items-center gap-4 px-4 py-2 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <img src={state.currentTrack.albumArt} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--sp-green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.currentTrack.title}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>{state.currentTrack.artist}</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>
              {Math.floor(state.currentTrack.duration / 60)}:{String(state.currentTrack.duration % 60).padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      {state.queue.length > 1 && (
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Next in queue
          </p>
          <AnimatePresence>
            {state.queue.map((track, idx) => {
              if (track.id === state.currentTrack?.id && idx === state.currentQueueIndex) return null;
              return (
                <motion.div
                  key={`${track.id}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group tap-highlight-none"
                  style={{ transition: 'background 0.1s', minHeight: '60px' }}
                  onClick={() => play(track)}
                  whileTap={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <span className="hidden md:inline" style={{ fontSize: '14px', color: 'var(--sp-text-secondary)', minWidth: '16px', textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <img src={track.albumArt} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '15px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.title}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                  </p>
                  <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100" style={{ transition: 'opacity 0.15s', flexShrink: 0 }}>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); play(track); }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 rounded"
                      style={{ color: 'white' }}
                    >
                      <Play size={14} fill="white" strokeWidth={0} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 rounded"
                      style={{ color: 'var(--sp-text-secondary)' }}
                    >
                      <X size={14} strokeWidth={2} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {state.queue.length === 0 && (
        <p style={{ color: 'var(--sp-text-secondary)' }}>Queue is empty</p>
      )}
    </div>
  );
}
