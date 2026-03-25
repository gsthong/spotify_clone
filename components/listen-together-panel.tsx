'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { ListenTogetherManager } from '@/lib/listen-together';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Link, Check, X, QrCode } from 'lucide-react';

export function ListenTogetherPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state } = useAudio();
  const [manager, setManager] = useState<ListenTogetherManager | null>(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !manager) {
      const lt = new ListenTogetherManager();
      setManager(lt);
    }
  }, [isOpen, manager]);

  useEffect(() => {
    if (manager) {
      intervalRef.current = setInterval(() => {
        manager.broadcast({
          trackId: state.currentTrack?.id || null,
          currentTime: state.currentTime,
          isPlaying: state.isPlaying,
          queue: state.queue,
          sentAt: Date.now()
        });
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [manager, state]);

  const sessionUrl = manager ? `${window.location.origin}/listen?session=${manager.id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-[80] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--sp-green)] rounded-full flex items-center justify-center text-black">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Listen Together</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Host a session</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                  <p className="text-sm font-medium text-white/60 leading-relaxed mb-6">
                    Sync your playback with friends. They will hear the same track at the same time.
                  </p>
                  
                  {manager ? (
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 p-4 bg-black rounded-2xl border border-white/10">
                           <input 
                             readOnly 
                             value={sessionUrl}
                             className="bg-transparent text-xs font-mono text-white/60 truncate flex-1 outline-none"
                           />
                           <button 
                             onClick={copyLink}
                             className={`p-2 rounded-xl transition-all ${copied ? 'bg-[var(--sp-green)] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                           >
                             {copied ? <Check size={16} /> : <Link size={16} />}
                           </button>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--sp-green)] animate-pulse">
                          Live Broadcasting...
                        </p>
                     </div>
                  ) : (
                    <div className="py-4 text-white/40 font-bold italic">Initializing session...</div>
                  )}
               </div>

               <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 Close Panel
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
