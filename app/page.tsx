'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Play, Clock } from 'lucide-react';
import { TrackRow } from '@/components/track-row';

export default function HomePage() {
  const { state, play, setQueue } = useAudio();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (state.queue.length === 0) setQueue(MOCK_TRACKS, 0);
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, [setQueue, state.queue.length]);

  return (
    <div className="h-full">
      {/* ── DESKTOP HOME (md+) ─────────────────────────────────── */}
      <div className="hidden md:block h-full overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#121212' }}>
        {/* Header gradient */}
        <div style={{ background: 'linear-gradient(to bottom, #1e3a2a 0%, #121212 340px)', padding: '24px 24px 0' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginBottom: '20px' }}>
            {greeting}
          </h1>

          {/* Quick picks — 3 col grid, 2 rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '32px' }}>
            {MOCK_TRACKS.slice(0, 6).map((track, i) => (
              <motion.div
                key={track.id}
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                className="flex items-center overflow-hidden rounded cursor-pointer group relative"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  height: '56px',
                  transition: 'background 0.15s',
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <img
                  src={track.albumArt}
                  alt=""
                  style={{ width: '56px', height: '56px', objectFit: 'cover', flexShrink: 0 }}
                />
                <p style={{
                  fontSize: '13px', fontWeight: 700, color: 'white',
                  padding: '0 12px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {track.title}
                </p>
                {/* Play button on hover */}
                <motion.div
                  className="absolute right-3 flex items-center justify-center rounded-full"
                  style={{ width: '32px', height: '32px', backgroundColor: '#1db954', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                >
                  <Play size={14} fill="black" strokeWidth={0} style={{ marginLeft: '2px' }} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px 32px' }}>
          {/* Recently played */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>Recently played</h2>
              <button
                style={{ fontSize: '13px', fontWeight: 700, color: '#b3b3b3', letterSpacing: '0.05em', transition: 'color 0.1s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#b3b3b3')}
              >
                Show all
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {MOCK_TRACKS.map((track, i) => (
                <motion.div
                  key={track.id}
                  onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                  className="cursor-pointer rounded-lg relative"
                  style={{ backgroundColor: '#181818', padding: '16px', transition: 'background 0.2s' }}
                  whileHover={{ backgroundColor: '#282828' }}
                >
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <img
                      src={track.albumArt}
                      alt=""
                      style={{
                        width: '100%', aspectRatio: '1', objectFit: 'cover',
                        borderRadius: '6px', display: 'block',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    />
                    <motion.div
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        bottom: '8px', right: '8px',
                        width: '40px', height: '40px',
                        backgroundColor: '#1db954',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                      initial={{ opacity: 0, y: 4 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      onClick={e => { e.stopPropagation(); setQueue(MOCK_TRACKS, i); play(track); }}
                    >
                      <Play size={16} fill="black" strokeWidth={0} style={{ marginLeft: '2px' }} />
                    </motion.div>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#b3b3b3', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artist}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Track list Spotify table */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Your top tracks</h2>

            {/* Table header */}
            <div
              className="flex items-center gap-4 px-4 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}
            >
              <span style={{ width: '16px', textAlign: 'center', fontSize: '13px', color: '#b3b3b3' }}>#</span>
              <div style={{ width: '40px', flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: '12px', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</p>
              <p style={{ fontSize: '12px', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '16px' }}>Album</p>
              <Clock size={14} color="#b3b3b3" style={{ flexShrink: 0 }} />
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

      {/* ── MOBILE HOME ────────────────────────────────────────── */}
      <div className="block md:hidden h-full overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#121212' }}>
        {/* Top greeting section */}
        <div style={{ background: 'linear-gradient(to bottom, #1e3a2a 0%, #121212 280px)', padding: '40px 16px 24px' }}>
          <div className="flex items-center justify-between mb-6">
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>
              {greeting}
            </h1>
            <div className="flex gap-4">
              <button style={{ color: 'white' }}><Clock size={20} /></button>
              <div 
                style={{ 
                  width: '28px', height: '28px', borderRadius: '50%', background: '#4a1a7a', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 
                }}
              >G</div>
            </div>
          </div>

          {/* Quick shuffle — 2 col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {MOCK_TRACKS.slice(0, 6).map((track, i) => (
              <motion.div
                key={`quick-mob-${track.id}`}
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
                whileTap={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <img src={track.albumArt} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                <p style={{
                  fontSize: '11px', fontWeight: 700, color: 'white',
                  padding: '0 8px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {track.title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recently played horizontal scroll */}
        <div className="mb-8 pl-4">
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>
            Recently played
          </h2>
          <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
            {MOCK_TRACKS.map((track, i) => (
              <div 
                key={`recent-mob-${track.id}`} 
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                style={{ width: '140px', flexShrink: 0 }}
                className="tap-highlight-none"
              >
                <img 
                  src={track.albumArt} 
                  alt="" 
                  style={{ width: '140px', height: '140px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px' }} 
                />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.artist}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top tracks vertical list */}
        <div className="px-4 pb-12">
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>
            Your top tracks
          </h2>
          <div className="flex flex-col gap-1">
            {MOCK_TRACKS.map((track, i) => (
              <div 
                key={`top-mob-${track.id}`}
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '60px' }}
                className="tap-highlight-none"
              >
                <img 
                  src={track.albumArt} 
                  alt="" 
                  style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '14px', fontWeight: 500, 
                    color: state.currentTrack?.id === track.id ? '#1db954' : 'white',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                  }}>
                    {track.title}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                  {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}