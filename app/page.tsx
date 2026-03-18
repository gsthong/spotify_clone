'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Play, Clock } from 'lucide-react';

const MOODS = [
  { label: 'Suy 🌧', mood: 'suy' },
  { label: 'Overdose ⚡', mood: 'overdose' },
  { label: 'Hype 🔥', mood: 'hype' },
  { label: 'Chill 🌿', mood: 'chill' },
];

function TrackRow({ track, index, isPlaying, isCurrent, onClick }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group"
      style={{
        backgroundColor: isCurrent ? 'rgba(255,255,255,0.07)' : hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* # or play icon */}
      <div className="flex-shrink-0" style={{ width: '16px', textAlign: 'center' }}>
        {hovered || (isCurrent && isPlaying) ? (
          <Play size={14} fill={isCurrent ? 'var(--sp-green)' : 'white'} strokeWidth={0} />
        ) : (
          <span style={{
            fontSize: '14px',
            color: isCurrent ? 'var(--sp-green)' : 'var(--sp-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      <img src={track.albumArt} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />

      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: '15px', fontWeight: 500,
          color: isCurrent ? 'var(--sp-green)' : 'white',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.title}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>{track.artist}</p>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>{track.album}</p>

      <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0, minWidth: '40px', textAlign: 'right' }}>
        {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
      </p>
    </motion.div>
  );
}

export default function HomePage() {
  const { state, play, setQueue } = useAudio();
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    if (state.queue.length === 0) setQueue(MOCK_TRACKS, 0);
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--sp-bg)' }}>
      {/* Top gradient header */}
      <div
        style={{
          background: 'linear-gradient(to bottom, #1a3a2a 0%, var(--sp-bg) 100%)',
          padding: '24px 24px 0',
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginBottom: '24px' }}>
          {greeting}
        </h1>

        {/* Quick picks grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {MOCK_TRACKS.slice(0, 6).map((track, i) => (
            <motion.div
              key={track.id}
              onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
              className="flex items-center rounded-md overflow-hidden cursor-pointer group relative"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: '56px', transition: 'background 0.1s' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <img src={track.albumArt} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.title}
              </p>
              {/* Green play button on hover */}
              <motion.div
                className="absolute right-3 flex items-center justify-center rounded-full"
                style={{ width: '32px', height: '32px', backgroundColor: 'var(--sp-green)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
              >
                <Play size={14} fill="black" strokeWidth={0} style={{ marginLeft: '2px' }} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        {/* Recently played section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>Recently played</h2>
            <button style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
            >Show all</button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {MOCK_TRACKS.map((track, i) => (
              <motion.div
                key={track.id}
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                className="cursor-pointer group relative"
                style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--sp-bg-elevated)', transition: 'background 0.2s' }}
                whileHover={{ backgroundColor: 'var(--sp-bg-highlight)' }}
              >
                <div className="relative mb-3">
                  <img
                    src={track.albumArt} alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'block' }}
                  />
                  {/* Green play button */}
                  <motion.div
                    className="absolute bottom-2 right-2 flex items-center justify-center rounded-full"
                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--sp-green)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    initial={{ opacity: 0, y: 8 }}
                    whileHover={{ opacity: 1, y: 0 }}
                  >
                    <Play size={16} fill="black" strokeWidth={0} style={{ marginLeft: '2px' }} />
                  </motion.div>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--sp-text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.artist}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Track list — Spotify table style */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Your top tracks</h2>

          {/* Table header */}
          <div
            className="flex items-center gap-4 px-4 pb-3 mb-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div style={{ width: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>#</span>
            </div>
            <div style={{ width: '40px', flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: '13px', color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</p>
            <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Album</p>
            <Clock size={14} color="var(--sp-text-secondary)" style={{ flexShrink: 0, minWidth: '40px' }} />
          </div>

          {MOCK_TRACKS.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              isPlaying={state.isPlaying}
              isCurrent={state.currentTrack?.id === track.id}
              onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
