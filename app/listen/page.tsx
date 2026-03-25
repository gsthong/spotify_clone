'use client';

import React, { useEffect, useState } from 'react';
import { useAudio } from '@/lib/audio-context';
import { ListenTogetherManager, ListenTogetherState } from '@/lib/listen-together';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Info } from 'lucide-react';

export default function ListenPage() {
  const { state, play, seek, setQueue } = useAudio();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [manager, setManager] = useState<ListenTogetherManager | null>(null);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  useEffect(() => {
    if (!sessionId) return;

    const lt = new ListenTogetherManager();
    lt.onSync((syncState: ListenTogetherState) => {
      setStatus('syncing');
      
      // Calculate latency adjustment
      const latency = (Date.now() - syncState.sentAt) / 1000;
      const targetTime = syncState.currentTime + latency;

      if (state.currentTrack?.id !== syncState.trackId && syncState.trackId) {
        // Ideally we'd fetch track details here if not in queue
        // For simplicity, we assume tracks are identifiable
      }

      if (Math.abs(state.currentTime - targetTime) > 1.5) {
        seek(targetTime);
      }
      
      setStatus('synced');
    });

    lt.join(sessionId);
    setManager(lt);

    return () => lt.destroy();
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[2rem] backdrop-blur-3xl shadow-2xl"
      >
        <div className="w-20 h-20 bg-[var(--sp-green)]/10 rounded-full flex items-center justify-center mx-auto mb-8 text-[var(--sp-green)]">
           <Users size={40} />
        </div>
        
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Listen Together</h1>
        
        {sessionId ? (
          <div className="space-y-6">
            <p className="text-white/60 font-medium">
              You are joining a synchronized session. The host controls the playback.
            </p>
            <div className="flex items-center justify-center gap-3 py-3 px-6 bg-white/10 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${status === 'synced' ? 'bg-[var(--sp-green)] animate-pulse' : 'bg-white/20'}`} />
              <span className="text-sm font-bold uppercase tracking-widest">{status === 'synced' ? 'Synced with Host' : 'Connecting...'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             <p className="text-white/60 font-medium">
              Share your session link from the Now Playing screen to start listening with friends.
            </p>
            <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left text-blue-300">
               <Info size={20} className="shrink-0 mt-0.5" />
               <p className="text-xs font-semibold leading-relaxed">
                 Syncing state only. Audio is streamed independently by each client to ensure maximum quality and zero lag.
               </p>
            </div>
          </div>
        )}

        <button 
          onClick={() => window.location.href = '/'}
          className="mt-12 w-full py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Return to Player
        </button>
      </motion.div>
    </div>
  );
}
