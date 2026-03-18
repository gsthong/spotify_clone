'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';

export default function StatsPage() {
  const { state, play, setQueue } = useAudio();

  const stats = useMemo(() => {
    const totalDuration = MOCK_TRACKS.reduce((s, t) => s + t.duration, 0);
    const moodCounts: Record<string, number> = { suy: 0, overdose: 0, hype: 0, chill: 0 };
    MOCK_TRACKS.forEach(t => { moodCounts[t.mood]++; });
    return {
      totalTracks: MOCK_TRACKS.length,
      totalMinutes: Math.floor(totalDuration / 60),
      uniqueArtists: new Set(MOCK_TRACKS.map(t => t.artist)).size,
      moodCounts,
    };
  }, []);

  const topTracks = [...MOCK_TRACKS].sort((a, b) => b.plays - a.plays);
  const maxPlays = topTracks[0]?.plays ?? 1;

  const moods = [
    { key: 'suy', label: 'Suy', color: '#4a1a7a' },
    { key: 'overdose', label: 'Overdose', color: '#b33000' },
    { key: 'hype', label: 'Hype', color: '#006450' },
    { key: 'chill', label: 'Chill', color: '#0d73ec' },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--sp-bg)' }}>
      {/* Header with gradient */}
      <div style={{ background: 'linear-gradient(to bottom, #1a0a3a 0%, var(--sp-bg) 100%)', padding: '32px 24px 24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Weekly Report
        </p>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: 'white', marginTop: '4px' }}>
          🔥 12 Day Streak
        </h1>
      </div>

      <div style={{ padding: '0 24px 32px' }}>
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Tracks', value: stats.totalTracks },
            { label: 'Minutes', value: stats.totalMinutes },
            { label: 'Artists', value: stats.uniqueArtists },
          ].map(s => (
            <div
              key={s.label}
              style={{ backgroundColor: 'var(--sp-bg-elevated)', borderRadius: '8px', padding: '24px 20px' }}
            >
              <p style={{ fontSize: '40px', fontWeight: 900, color: 'white' }}>{s.value}</p>
              <p style={{ fontSize: '14px', color: 'var(--sp-text-secondary)', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top tracks */}
        <div className="mb-10">
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Top this week</h2>
          {topTracks.map((track, i) => (
            <motion.div
              key={track.id}
              onClick={() => { setQueue(MOCK_TRACKS, MOCK_TRACKS.indexOf(track)); play(track); }}
              className="flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer"
              style={{ transition: 'background 0.1s' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--sp-text-secondary)', minWidth: '24px' }}>{i + 1}</span>
              <img src={track.albumArt} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '15px', fontWeight: 700, color: state.currentTrack?.id === track.id ? 'var(--sp-green)' : 'white' }}>
                  {track.title}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>{track.artist}</p>
              </div>
              <div style={{ width: '100px', flexShrink: 0 }}>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', backgroundColor: 'var(--sp-green)', borderRadius: '2px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(track.plays / maxPlays) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--sp-text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                  {(track.plays / 1000000).toFixed(1)}M
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mood breakdown */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Mood breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            {moods.map(({ key, label, color }) => {
              const pct = Math.round((stats.moodCounts[key] / stats.totalTracks) * 100) || 0;
              return (
                <div key={key} style={{ backgroundColor: color, borderRadius: '8px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>{pct}%</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
