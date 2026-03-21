'use client';

import React, { useEffect, useState } from 'react';
import { Track } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ZenPlayerProps {
  track: Track;
}

export function ZenPlayer({ track }: ZenPlayerProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(a => (a + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
           key={active}
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.2 }}
           transition={{ duration: 3, ease: 'easeInOut' }}
           className="absolute inset-0 flex items-center justify-center overflow-hidden"
        >
           <div 
             className="w-[300%] h-[300%] opacity-20 blur-[100px] animate-pulse"
             style={{ 
               background: `radial-gradient(circle, var(--sp-green) 0%, transparent 70%)`,
               transform: `rotate(${active * 90}deg)`
             }}
           />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 text-center px-12">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-4xl font-black text-white/20 uppercase tracking-[0.5em] mb-4"
        >
          Zen
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2, delay: 1 }}
          className="text-lg font-bold text-white/50"
        >
          {track.title}
        </motion.p>
      </div>
    </div>
  );
}
