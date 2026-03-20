'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { useAudio } from '@/lib/audio-context';
import { Track } from '@/lib/types';
import { Play, Clock, Calendar } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface HistoryItem {
  track: Track;
  playedAt: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<{ day: string; items: HistoryItem[] }[]>([]);
  const { play } = useAudio();

  useEffect(() => {
    const loadHistory = async () => {
      const logs = await db.history.orderBy('playedAt').reverse().toArray();
      const trackIds = Array.from(new Set(logs.map(l => l.trackId)));
      const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();
      const trackMap = new Map(tracks.map(t => [t.id, t]));

      const grouped: { [key: string]: HistoryItem[] } = {};
      
      logs.forEach(log => {
        const track = trackMap.get(log.trackId);
        if (!track) return;
        
        const date = new Date(log.playedAt);
        const day = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({ track, playedAt: log.playedAt });
      });

      setHistory(Object.entries(grouped).map(([day, items]) => ({ day, items })));
    };

    loadHistory();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'var(--sp-bg)' }}>
      <header className="mb-10">
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>Recently Played</h1>
        <p style={{ color: 'var(--sp-text-secondary)', marginTop: '4px' }}>Your listening history across all devices</p>
      </header>

      <div className="flex flex-col gap-12">
        {history.map(({ day, items }) => (
          <section key={day}>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
              <Calendar size={16} className="text-white/40" />
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {day}
              </h2>
            </div>

            <div className="flex flex-col gap-1">
              {items.map((item, idx) => (
                <motion.div
                  key={`${item.track.id}-${item.playedAt}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-2 rounded-md hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => play(item.track)}
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <img src={item.track.albumArt} alt="" className="w-full h-full object-cover rounded shadow-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <Play size={20} fill="white" strokeWidth={0} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.track.title}</p>
                    <p className="text-sm text-white/60 truncate">{item.track.artist}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(item.playedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="hidden sm:inline w-12 text-right">{formatTime(item.track.duration)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <p>Your listening history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
