'use client';

import React from 'react';
import { Track } from '@/lib/types';
import { motion } from 'framer-motion';

interface FocusPlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
}

export function FocusPlayer({ track, isPlaying, progress }: FocusPlayerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-64 h-64 relative mb-12">
        {/* Simple Ring Progress */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
           <circle 
            cx="50" cy="50" r="45" 
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" 
           />
           <motion.circle 
            cx="50" cy="50" r="45" 
            fill="none" stroke="var(--sp-green)" strokeWidth="2" 
            strokeLinecap="round"
            strokeDasharray="283"
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (progress / 100) * 283 }}
            transition={{ duration: 0.5, ease: 'linear' }}
           />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
           </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-white mb-2">{track.title}</h2>
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Stay Focused</p>
      </div>
    </div>
  );
}
