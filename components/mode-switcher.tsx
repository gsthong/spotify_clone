'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Library, Terminal, Sparkles, Target, Layout } from 'lucide-react';
import { PlayerMode } from '@/lib/types';

interface ModeSwitcherProps {
  currentMode: PlayerMode;
  onSelect: (mode: PlayerMode) => void;
  onClose: () => void;
}

const MODES: { id: PlayerMode; label: string; icon: any }[] = [
  { id: 'default', label: 'Default', icon: Layout },
  { id: 'vinyl', label: 'Vinyl', icon: Disc },
  { id: 'cassette', label: 'Cassette', icon: Library },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'zen', label: 'Zen Art', icon: Sparkles },
  { id: 'focus', label: 'Focus', icon: Target },
  { id: 'concert', label: 'Concert', icon: Disc },
  { id: 'night-drive', label: 'Night Drive', icon: Layout },
];

export function ModeSwitcher({ currentMode, onSelect, onClose }: ModeSwitcherProps) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="absolute bottom-full right-0 mb-4 w-52 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[70] p-2"
      >
        <p className="px-3 py-2 text-[10px] font-black text-white/40 uppercase tracking-widest">Player Style</p>
        <div className="flex flex-col gap-1">
          {MODES.map((mode) => {
            const active = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => { onSelect(mode.id); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  active ? 'bg-white/10 text-[var(--sp-green)]' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <mode.icon size={18} />
                <span className="text-sm font-bold">{mode.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--sp-green)] shadow-[0_0_8px_var(--sp-green)]" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
