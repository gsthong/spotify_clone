'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useYouTubeSearch } from '@/hooks/use-youtube-search';
import { db } from '@/lib/db';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Track } from '@/lib/types';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

const BROWSE_CATEGORIES = [
  { label: 'Suy', color: '#4a1a7a', mood: 'suy' as const },
  { label: 'Overdose', color: '#b33000', mood: 'overdose' as const },
  { label: 'Hype', color: '#006450', mood: 'hype' as const },
  { label: 'Chill', color: '#0d73ec', mood: 'chill' as const },
  { label: 'All tracks', color: '#503750', mood: null },
];

const MOOD_FILTERS = ['all', 'suy', 'overdose', 'hype', 'chill'] as const;
type MoodFilter = typeof MOOD_FILTERS[number];

const DURATION_FILTERS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '< 3m', min: 0, max: 180 },
  { label: '3m - 5m', min: 180, max: 300 },
  { label: '> 5m', min: 300, max: Infinity },
];

function TrackSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          animation: 'pulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            width: '60%',
            height: '14px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '40%',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.07)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <div
        style={{
          width: '36px',
          height: '12px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.07)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default function SearchPage() {
  const { state, play, setQueue } = useAudio();
  const { search } = useYouTubeSearch();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<MoodFilter>('all');
  const [durationFilter, setDurationFilter] = useState(DURATION_FILTERS[0]);
  const [searchLibrary, setSearchLibrary] = useState(false);
  const [libraryResults, setLibraryResults] = useState<Track[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      setActiveMood('all');

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!val.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        const tracks = await search(val.trim());
        setResults(tracks);
        
        // Search local DB too
        const local = await db.tracks
          .where('title').startsWithIgnoreCase(val.trim())
          .or('artist').startsWithIgnoreCase(val.trim())
          .toArray();
        setLibraryResults(local);
        
        setIsLoading(false);
      }, 400);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const baseResults = searchLibrary ? libraryResults : results;

  const filteredResults = baseResults.filter(t => {
    const moodMatch = activeMood === 'all' || t.mood === activeMood;
    const durMatch = t.duration >= durationFilter.min && t.duration <= durationFilter.max;
    return moodMatch && durMatch;
  });

  const handleTrackClick = useCallback(
    (track: Track, index: number) => {
      setQueue(filteredResults, index);
      play(track);
    },
    [filteredResults, setQueue, play]
  );

  const showResults = query.trim().length > 0;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--sp-bg)', padding: '24px' }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Search input */}
      <div className="relative mb-6" style={{ maxWidth: '360px' }}>
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2"
          size={16}
          color="#121212"
        />
        <input
          type="text"
          placeholder="What do you want to play?"
          value={query}
          onChange={handleQueryChange}
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

      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {/* Mood filter pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {MOOD_FILTERS.map(mood => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(mood)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '500px',
                    border: '1px solid',
                    borderColor: activeMood === mood ? 'var(--sp-green)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: activeMood === mood ? 'var(--sp-green)' : 'transparent',
                    color: activeMood === mood ? '#000' : 'var(--sp-text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s',
                  }}
                >
                  {mood}
                </button>
              ))}

              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

              {DURATION_FILTERS.map(f => (
                <button
                  key={f.label}
                  onClick={() => setDurationFilter(f)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '500px',
                    backgroundColor: durationFilter.label === f.label ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: durationFilter.label === f.label ? 'white' : 'var(--sp-text-secondary)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {f.label}
                </button>
              ))}

              <button
                onClick={() => setSearchLibrary(!searchLibrary)}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  borderRadius: '500px',
                  backgroundColor: searchLibrary ? 'var(--sp-green)' : 'rgba(255,255,255,0.05)',
                  color: searchLibrary ? 'black' : 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {searchLibrary ? 'Searching Library' : 'Searching YouTube'}
              </button>
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: 'white',
                marginBottom: '16px',
              }}
            >
              Results for &ldquo;{query}&rdquo;
            </h2>

            {isLoading ? (
              <div>
                <TrackSkeleton />
                <TrackSkeleton />
                <TrackSkeleton />
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((track, i) => (
                <motion.div
                  key={`${track.id}-${i}`}
                  onClick={() => handleTrackClick(track, i)}
                  className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer"
                  style={{ transition: 'background 0.1s' }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <img
                    src={track.albumArt}
                    alt=""
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color:
                          state.currentTrack?.id === track.id
                            ? 'var(--sp-green)'
                            : 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {track.title}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--sp-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {track.artist}
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>
                    {Math.floor(track.duration / 60)}:
                    {String(track.duration % 60).padStart(2, '0')}
                  </p>
                </motion.div>
              ))
            ) : (
              <p style={{ color: 'var(--sp-text-secondary)' }}>
                No results found for &ldquo;{query}&rdquo;
              </p>
            )}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--sp-text-secondary)', fontSize: '13px' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Searching YouTube Music…
              </div>
            )}
          </motion.div>
        ) : (
          /* Browse categories */
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: 'white',
                marginBottom: '16px',
              }}
            >
              Browse by mood
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BROWSE_CATEGORIES.map(cat => (
                <motion.div
                  key={cat.label}
                  onClick={() => {
                    const tracks = cat.mood
                      ? MOCK_TRACKS.filter(t => t.mood === cat.mood)
                      : MOCK_TRACKS;
                    if (tracks.length) {
                      setQueue(tracks, 0);
                      play(tracks[0]);
                    }
                  }}
                  className="relative overflow-hidden rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: cat.color,
                    aspectRatio: '1',
                    padding: '16px',
                    height: 'auto',
                    minHeight: '100px',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: 'white',
                      lineHeight: 1.2,
                    }}
                  >
                    {cat.label}
                  </p>
                  <div
                    className="absolute bottom-0 right-0"
                    style={{
                      width: '70px',
                      height: '70px',
                      backgroundImage: `url(${MOCK_TRACKS[0].albumArt})`,
                      backgroundSize: 'cover',
                      borderRadius: '4px',
                      transform: 'rotate(25deg) translate(20px, 10px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
