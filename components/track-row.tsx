'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, MoreHorizontal, Heart } from 'lucide-react';
import { Track } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

export function TrackRow({ track, index, isPlaying, isCurrent, onClick }: TrackRowProps) {
  return (
    <motion.div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group hover:bg-white/10"
      style={{ transition: 'background 0.1s' }}
    >
      <div style={{ width: '16px', textAlign: 'center', fontSize: '14px', color: isCurrent ? 'var(--sp-green)' : '#b3b3b3' }}>
        {isCurrent && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-3">
            <motion.div
              animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{ width: '2px', backgroundColor: 'var(--sp-green)' }}
            />
            <motion.div
              animate={{ height: ['60%', '20%', '100%', '40%', '60%'] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ width: '2px', backgroundColor: 'var(--sp-green)' }}
            />
            <motion.div
              animate={{ height: ['40%', '80%', '20%', '100%', '40%'] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              style={{ width: '2px', backgroundColor: 'var(--sp-green)' }}
            />
          </div>
        ) : isCurrent ? (
          <Play size={12} fill="var(--sp-green)" strokeWidth={0} />
        ) : (
          <span className="group-hover:hidden">{index + 1}</span>
        )}
        {!isCurrent && (
          <Play size={12} fill="white" strokeWidth={0} className="hidden group-hover:block mx-auto" />
        )}
      </div>

      <img
        src={track.albumArt}
        alt=""
        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
      />

      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: isCurrent ? 'var(--sp-green)' : 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.title}
        </p>
        <p
          style={{
            fontSize: '13px',
            color: '#b3b3b3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '2px',
          }}
        >
          {track.artist}
        </p>
      </div>

      <p className="hidden md:block flex-1 text-sm text-[#b3b3b3] truncate">
        {track.title}
      </p>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-[#b3b3b3] hover:text-white">
          <Heart size={16} />
        </button>
        <span style={{ fontSize: '13px', color: '#b3b3b3', minWidth: '38px', textAlign: 'right' }}>
          {formatTime(track.duration)}
        </span>
        <button className="text-[#b3b3b3] hover:text-white">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </motion.div>
  );
}
