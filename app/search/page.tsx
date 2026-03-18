'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Search as SearchIcon, Play } from 'lucide-react';

const BROWSE_CATEGORIES = [
  { label: 'Suy 🌧', color: '#4a1a7a', mood: 'suy' },
  { label: 'Overdose ⚡', color: '#b33000', mood: 'overdose' },
  { label: 'Hype 🔥', color: '#006450', mood: 'hype' },
  { label: 'Chill 🌿', color: '#0d73ec', mood: 'chill' },
  { label: 'All tracks', color: '#503750', mood: null },
];

export default function SearchPage() {
  const { state, play, setQueue } = useAudio();
  const [query, setQuery] = useState('');

  const results = query
    ? MOCK_TRACKS.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.artist.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--sp-bg)', padding: '24px' }}>
      {/* Search input */}
      <div className="relative mb-8" style={{ maxWidth: '360px' }}>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color="#121212" />
        <input
          type="text"
          placeholder="What do you want to play?"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'white',
            color: '#121212',
            border: 'none',
            borderRadius: '500px',
            padding: '10px 16px 10px 40px',
            fontSize: '14px',
            fontWeight: 500,
            outline: 'none',
          }}
        />
      </div>

      {query ? (
        /* Search results */
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>
            Results for "{query}"
          </h2>
          {results.length > 0 ? results.map((track, i) => (
            <motion.div
              key={track.id}
              onClick={() => { setQueue(MOCK_TRACKS, MOCK_TRACKS.indexOf(track)); play(track); }}
              className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer"
              style={{ transition: 'background 0.1s' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <img src={track.albumArt} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '15px', fontWeight: 500, color: state.currentTrack?.id === track.id ? 'var(--sp-green)' : 'white' }}>
                  {track.title}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>{track.artist}</p>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)' }}>
                {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
              </p>
            </motion.div>
          )) : (
            <p style={{ color: 'var(--sp-text-secondary)' }}>No results found for "{query}"</p>
          )}
        </div>
      ) : (
        /* Browse categories */
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>Browse by mood</h2>
          <div className="grid grid-cols-4 gap-4">
            {BROWSE_CATEGORIES.map(cat => (
              <motion.div
                key={cat.label}
                onClick={() => {
                  const tracks = cat.mood ? MOCK_TRACKS.filter(t => t.mood === cat.mood) : MOCK_TRACKS;
                  if (tracks.length) { setQueue(tracks, 0); play(tracks[0]); }
                }}
                className="relative overflow-hidden rounded-lg cursor-pointer"
                style={{ backgroundColor: cat.color, aspectRatio: '1', padding: '16px' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p style={{ fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>{cat.label}</p>
                <div
                  className="absolute bottom-0 right-0"
                  style={{
                    width: '70px', height: '70px',
                    backgroundImage: `url(${MOCK_TRACKS[0].albumArt})`,
                    backgroundSize: 'cover',
                    borderRadius: '4px',
                    transform: 'rotate(25deg) translate(10px, 10px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
