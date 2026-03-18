'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Play, Clock } from 'lucide-react';

function TrackRow({ track, index, isPlaying, isCurrent, onClick }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer"
      style={{
        backgroundColor: isCurrent
          ? 'rgba(255,255,255,0.1)'
          : hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Index or play icon */}
      <div style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>
        {hovered ? (
          <Play size={14} fill={isCurrent ? '#1db954' : 'white'} strokeWidth={0} />
        ) : (
          <span style={{ fontSize: '14px', color: isCurrent ? '#1db954' : '#b3b3b3', fontVariantNumeric: 'tabular-nums' }}>
            {index + 1}
          </span>
        )}
      </div>

      <img
        src={track.albumArt}
        alt=""
        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
      />

      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: '15px', fontWeight: 500,
          color: isCurrent ? '#1db954' : 'white',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.title}
        </p>
        <p style={{ fontSize: '13px', color: '#b3b3b3', marginTop: '1px' }}>{track.artist}</p>
      </div>

      <p style={{ fontSize: '13px', color: '#b3b3b3', flexShrink: 0, marginRight: '16px' }}>{track.album}</p>

      <p style={{ fontSize: '13px', color: '#b3b3b3', flexShrink: 0, minWidth: '40px', textAlign: 'right' }}>
        {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
      </p>
    </div>
  );
}

export default function HomePage() {
  const { state, play, setQueue } = useAudio();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (state.queue.length === 0) setQueue(MOCK_TRACKS, 0);
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#121212' }}>
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
  );
}