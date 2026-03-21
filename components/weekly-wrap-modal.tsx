'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Share2, Flame, Sparkles } from 'lucide-react';
import { WeeklyStats } from '@/hooks/use-weekly-stats';
import { Mood } from '@/lib/types';

interface WeeklyWrapModalProps {
  stats: WeeklyStats;
  onClose: () => void;
}

const MOOD_GRADIENTS: Record<string, string> = {
  suy: 'linear-gradient(135deg, #1a0a2e, #0d1b2a)',
  hype: 'linear-gradient(135deg, #1a0a00, #2d1500)',
  overdose: 'linear-gradient(135deg, #0a001a, #1a0030)',
  chill: 'linear-gradient(135deg, #001a0a, #001520)',
  default: 'linear-gradient(135deg, #121212, #000000)'
};

const MOOD_EMOJIS: Record<string, string> = {
  suy: '🌧',
  hype: '⚡',
  overdose: '🔥',
  chill: '🌊'
};

export function WeeklyWrapModal({ stats, onClose }: WeeklyWrapModalProps) {
  const [slide, setSlide] = useState(0);
  const totalSlides = 3;

  const bg = MOOD_GRADIENTS[stats.dominantMood as string] || MOOD_GRADIENTS.default;

  const nextSlide = () => {
    if (slide < totalSlides - 1) setSlide(slide + 1);
    else onClose();
  };

  const prevSlide = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6"
      style={{ background: bg }}
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
      >
        <X size={28} />
      </button>

      <div className="w-full max-w-md aspect-[9/16] relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {slide === 0 && (
            <motion.div
              key="slide0"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <h2 className="text-white/60 text-sm font-black uppercase tracking-[0.2em] mb-4">Your week in music</h2>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[80px] font-black text-white leading-none">{stats.totalMinutes}</span>
                <span className="text-2xl font-black text-white/40">min</span>
              </div>
              <p className="text-white/60 text-lg mb-12">That's {Math.round(stats.totalMinutes / 3.5)} songs worth of vibes</p>
              
              {stats.dominantMood && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Dominant Mood</p>
                  <p className="text-2xl font-black text-white">
                    Mostly {stats.dominantMood.toUpperCase()} {MOOD_EMOJIS[stats.dominantMood] || ''}
                  </p>
                </div>
              )}

              <div className="absolute bottom-12 left-0 right-0 px-8">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.totalMinutes / 600) * 100)}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {slide === 1 && (
            <motion.div
              key="slide1"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="flex-1 flex flex-col p-8"
            >
              <h2 className="text-white/60 text-sm font-black uppercase tracking-[0.2em] mb-12 text-center">Top 3 tracks</h2>
              
              <div className="flex flex-col gap-8">
                {stats.topTracks.map((item, idx) => (
                  <div key={item.track.id} className="flex items-center gap-4">
                    <span className="text-white/20 font-black text-3xl italic w-8">{idx + 1}</span>
                    <img src={item.track.albumArt} className="w-16 h-16 rounded-lg shadow-2xl" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate text-lg">{item.track.title}</p>
                      <p className="text-white/40 truncate">{item.track.artist}</p>
                      <p className="text-[10px] text-[var(--sp-green)] font-bold uppercase mt-1">Played {item.count} times</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {slide === 2 && (
            <motion.div
              key="slide2"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white mb-6">
                <Sparkles size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Come back next week</h2>
              <p className="text-white/40 mb-12 italic text-sm">Every Monday we'll have a new wrap ready for you.</p>

              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <Flame size={20} className="text-orange-500 mx-auto mb-2" />
                  <p className="text-white font-black text-xl">{stats.daysActive}</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">Day streak</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <Music size={20} className="text-[var(--sp-green)] mx-auto mb-2" />
                  <p className="text-white font-black text-xl">+{stats.newThisWeek}</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">New finds</p>
                </div>
              </div>

              <button
                className="w-full bg-white text-black font-black py-4 rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <Share2 size={18} />
                Share this Vibe
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map(i => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? 'w-8 bg-white' : 'w-1.5 bg-white/20'}`}
          />
        ))}
      </div>

      {/* Slide controls */}
      <div className="absolute inset-y-0 left-0 w-1/4" onClick={prevSlide} />
      <div className="absolute inset-y-0 right-0 w-1/4" onClick={nextSlide} />
    </motion.div>
  );
}
