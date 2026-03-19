'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Users } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { useArtist } from '@/hooks/use-artist';
import { useYouTubeSearch } from '@/hooks/use-youtube-search';

interface ArtistPanelProps {
  artistName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtistPanel({ artistName, isOpen, onClose }: ArtistPanelProps) {
  const { play, setQueue } = useAudio();
  const { bio, topTracks, similarArtists, isLoading } = useArtist(artistName);
  const { search } = useYouTubeSearch();

  const handlePlayTopTrack = async (trackName: string) => {
    const query = `${artistName} ${trackName}`;
    const results = await search(query);
    if (results.length > 0) {
      setQueue(results, 0);
      play(results[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 md:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              fixed z-[80] bg-[#181818] overflow-y-auto
              bottom-0 left-0 right-0 h-[80vh] rounded-t-[20px] px-6 py-8
              md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-[360px] md:h-full md:rounded-none
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white truncate pr-4">
                {artistName}
              </h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-white/40 font-medium">
                Loading artist info...
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {/* Bio Section */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">About</h3>
                  <p className="text-[14px] leading-relaxed text-white/70">
                    {bio}
                  </p>
                </section>

                {/* Top Tracks Section */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">Top Tracks</h3>
                  <div className="flex flex-col gap-2">
                    {topTracks?.map((track, i) => (
                      <div 
                        key={track.name}
                        onClick={() => handlePlayTopTrack(track.name)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-white/30 text-xs font-bold w-4">{i + 1}</span>
                          <p className="text-white text-sm font-bold truncate group-hover:text-[var(--sp-green)]">
                            {track.name}
                          </p>
                        </div>
                        <Play size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Similar Artists Section */}
                {similarArtists && similarArtists.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 mb-4">Similar Artists</h3>
                    <div className="flex flex-wrap gap-2">
                      {similarArtists.map(artist => (
                        <button
                          key={artist.name}
                          onClick={() => {
                            // In a real app, this would browse to that artist.
                            // For now, let's play their top track.
                            handlePlayTopTrack(artist.name);
                          }}
                          className="px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-white/70 hover:bg-white/10 hover:border-white/30 transition-all flex items-center gap-2"
                        >
                          <Users size={12} />
                          {artist.name}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
