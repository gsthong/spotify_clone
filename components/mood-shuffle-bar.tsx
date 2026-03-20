'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { Mood } from '@/lib/types';

const MOODS: { label: string; value: Mood; emoji: string }[] = [
  { label: 'ALL', value: null, emoji: '' },
  { label: 'SUY', value: 'suy', emoji: '🌧' },
  { label: 'OVERDOSE', value: 'overdose', emoji: '⚡' },
  { label: 'HYPE', value: 'hype', emoji: '🔥' },
  { label: 'CHILL', value: 'chill', emoji: '🌿' },
];

export function MoodShuffleBar({ isMobile = false }: { isMobile?: boolean }) {
  const { state, smartShuffle } = useAudio();

  return (
    <div 
      className={`flex items-center gap-2 overflow-x-auto scroll-hide py-2 px-1 ${
        isMobile ? 'border-b border-white/5 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-20' : ''
      }`}
    >
      {MOODS.map((m) => {
        const isActive = state.shuffleMood === m.value;
        return (
          <motion.button
            key={m.label}
            onClick={() => smartShuffle(m.value)}
            whileTap={{ scale: 0.95 }}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-all
              ${isActive 
                ? 'bg-[#1db954] text-black shadow-[0_0_15px_rgba(29,185,84,0.3)]' 
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
            style={{ textTransform: 'uppercase' }}
          >
            {m.label} {m.emoji}
          </motion.button>
        );
      })}
    </div>
  );
}
