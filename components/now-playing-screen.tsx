'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { useNowPlaying } from '@/lib/now-playing-context';
import { formatTime } from '@/lib/utils';
import { LyricsView } from '@/components/lyrics-view';
import { ArtistPanel } from '@/components/artist-panel';
import { ShareSheet } from '@/components/share-sheet';
import {
  ChevronDown, MoreHorizontal,
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX, Heart, Share2, Radio, Layout
} from 'lucide-react';

import { ModeSwitcher } from '@/components/mode-switcher';
// Import player modes (to be created)
import { VinylPlayer } from '@/components/player-modes/vinyl-player';
import { CassettePlayer } from '@/components/player-modes/cassette-player';
import { ZenPlayer } from '@/components/player-modes/zen-player';
import { FocusPlayer } from '@/components/player-modes/focus-player';
import { ConcertPlayer } from '@/components/player-modes/concert-player';
import { NightDrivePlayer } from '@/components/player-modes/night-drive-player';
import { ListenTogetherPanel } from '@/components/listen-together-panel';

export function NowPlayingScreen() {
  const { state, togglePlay, seek, setVolume, nextTrack, previousTrack, toggleMute, toggleRadio, setPlayerMode } = useAudio();
  const { showNowPlaying, closeNowPlaying } = useNowPlaying();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [albumKey, setAlbumKey] = useState(0);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showArtistPanel, setShowArtistPanel] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);
  const [isListenTogetherOpen, setIsListenTogetherOpen] = useState(false);

  useEffect(() => { 
    setAlbumKey(k => k + 1); 
    setShowFullLyrics(false);
  }, [state.currentTrack?.id]);


  const duration = state.currentTrack?.duration ?? 0;
  const progressPercent = duration > 0 ? Math.min(100, (state.currentTime / duration) * 100) : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
  }, [duration, seek]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 80) {
      closeNowPlaying();
    }
  };

  if (!state.currentTrack) return null;

  return (
    <AnimatePresence>
      {showNowPlaying && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          drag={showFullLyrics ? false : "y"}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {/* Background — blurred album art with color bleed effect */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${state.currentTrack.albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.35)',
              transform: 'scale(1.3)',
            }}
          />
          {/* Bottom gradient for text readability */}
          <div 
            className="absolute inset-0" 
            style={{ 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)' 
            }} 
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-6 pt-6 pb-10 max-w-lg mx-auto w-full tap-highlight-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <motion.button onClick={closeNowPlaying} whileTap={{ scale: 0.9 }}>
                <ChevronDown size={28} color="white" />
              </motion.button>
               <div className="text-center">
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Playing from Library
                </p>
              </div>
              <div className="relative">
                <button onClick={() => setShowModeSwitcher(!showModeSwitcher)} className="text-white/60 hover:text-white transition-colors">
                  <Layout size={24} />
                </button>
                <AnimatePresence>
                  {showModeSwitcher && (
                    <ModeSwitcher 
                      currentMode={state.playerMode} 
                      onSelect={setPlayerMode} 
                      onClose={() => setShowModeSwitcher(false)} 
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Player Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              {state.playerMode === 'vinyl' ? (
                <VinylPlayer track={state.currentTrack} isPlaying={state.isPlaying} />
              ) : state.playerMode === 'cassette' ? (
                <CassettePlayer track={state.currentTrack} isPlaying={state.isPlaying} progress={progressPercent} />
              ) : state.playerMode === 'zen' ? (
                <ZenPlayer track={state.currentTrack} />
              ) : state.playerMode === 'focus' ? (
                <FocusPlayer track={state.currentTrack} isPlaying={state.isPlaying} progress={progressPercent} />
              ) : state.playerMode === 'concert' ? (
                <ConcertPlayer />
              ) : state.playerMode === 'night-drive' ? (
                <NightDrivePlayer />
              ) : (
                <>
                  {/* Album art — Large on mobile */}
                  <motion.div
                    layoutId="mobile-album-art"
                    key={albumKey}
                    className="flex justify-center mb-10 mt-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img
                      src={state.currentTrack.albumArt}
                      alt=""
                      style={{
                        width: 'calc(100vw - 48px)',
                        maxWidth: '360px',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                      }}
                    />
                  </motion.div>

                  {/* Track info + heart */}
                  <div className="flex items-center justify-between mb-6 px-1 w-full">
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: '24px', fontWeight: 900, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {state.currentTrack.title}
                      </p>
                      <p 
                        onClick={() => setShowArtistPanel(true)}
                        style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: '2px', cursor: 'pointer' }}
                      >
                        {state.currentTrack.artist}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setIsFavorite(f => !f)}
                      whileTap={{ scale: 0.8 }}
                      style={{ color: isFavorite ? 'var(--sp-green)' : 'white', flexShrink: 0, marginLeft: '16px' }}
                    >
                      <Heart size={26} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </motion.button>
                  </div>
                </>
              )}
            </div>

            {/* Progress */}
            <div className="mb-4 px-1">
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="relative flex items-center cursor-pointer group"
                style={{ height: '20px', marginBottom: '4px' }}
              >
                <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div
                  className="absolute rounded-full"
                  style={{ height: '4px', width: `${progressPercent}%`, backgroundColor: 'white' }}
                />
                <div
                  className="absolute w-3 h-3 rounded-full"
                  style={{ 
                    left: `${progressPercent}%`, 
                    transform: 'translateX(-50%)', 
                    backgroundColor: 'white',
                    display: 'block'
                  }}
                />
              </div>
              <div className="flex justify-between" style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6 px-1">
              <button style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Shuffle size={20} strokeWidth={2} />
              </button>
              <motion.button onClick={previousTrack} whileTap={{ scale: 0.9 }} style={{ color: 'white' }}>
                <SkipBack size={32} fill="white" strokeWidth={0} />
              </motion.button>
              <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.94 }}
                className="flex items-center justify-center rounded-full"
                style={{ width: '64px', height: '64px', backgroundColor: 'white', color: 'black' }}
              >
                {state.isPlaying
                  ? <Pause size={28} fill="black" strokeWidth={0} />
                  : <Play size={28} fill="black" strokeWidth={0} style={{ marginLeft: '4px' }} />}
              </motion.button>
              <motion.button onClick={nextTrack} whileTap={{ scale: 0.9 }} style={{ color: 'white' }}>
                <SkipForward size={32} fill="white" strokeWidth={0} />
              </motion.button>
              <button style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Repeat size={20} strokeWidth={2} />
              </button>
              <motion.button 
                onClick={toggleRadio}
                whileTap={{ scale: 0.9 }}
                style={{ color: state.radioMode ? 'var(--sp-green)' : 'rgba(255,255,255,0.6)' }}
              >
                <Radio size={20} strokeWidth={2} />
              </motion.button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 px-1 mb-6">
              <button onClick={toggleMute} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                {state.isMuted || state.volume === 0
                  ? <VolumeX size={16} strokeWidth={1.5} />
                  : <Volume2 size={16} strokeWidth={1.5} />}
              </button>
              <div
                className="flex-1 relative flex items-center cursor-pointer"
                style={{ height: '20px' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                }}
              >
                <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div
                  className="absolute rounded-full"
                  style={{ height: '4px', width: `${(state.isMuted ? 0 : state.volume) * 100}%`, backgroundColor: 'white' }}
                />
              </div>
            </div>

            {/* Lyrics View - Inline */}
            <div className="mb-6">
              <LyricsView mode="inline" onClose={() => setShowFullLyrics(true)} />
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between px-1">
              <button 
                onClick={() => setShowShareSheet(true)}
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <Share2 size={20} />
              </button>
              <button style={{ color: 'rgba(255,255,255,0.7)' }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Fullscreen Lyrics Overlay */}
            <AnimatePresence>
              {showFullLyrics && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="fixed inset-0 z-[60]"
                >
                  <LyricsView mode="fullscreen" onClose={() => setShowFullLyrics(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Artist Panel */}
            <ArtistPanel 
              artistName={state.currentTrack.artist}
              isOpen={showArtistPanel}
              onClose={() => setShowArtistPanel(false)}
            />

            {/* Share Sheet */}
            <ShareSheet
              track={state.currentTrack}
              currentTime={state.currentTime}
              isOpen={showShareSheet}
              onClose={() => setShowShareSheet(false)}
              onOpenListenTogether={() => setIsListenTogetherOpen(true)}
            />

            <ListenTogetherPanel 
              isOpen={isListenTogetherOpen}
              onClose={() => setIsListenTogetherOpen(false)}
            />

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}