'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { useLyrics } from '@/hooks/use-lyrics';

interface LyricsViewProps {
  mode: 'inline' | 'fullscreen';
  onClose?: () => void;
}

export function LyricsView({ mode, onClose }: LyricsViewProps) {
  const { state } = useAudio();
  const { lines, currentLine, hasLyrics, isLoading, plainLyrics } = useLyrics(state.currentTrack, state.currentTime);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for both modes
  useEffect(() => {
    if (currentLine === -1 || !scrollRef.current) return;

    const activeLine = scrollRef.current.children[currentLine] as HTMLElement;
    if (activeLine && containerRef.current) {
      const container = containerRef.current;
      const offset = mode === 'fullscreen' ? container.offsetHeight * 0.35 : container.offsetHeight / 2 - activeLine.offsetHeight / 2;
      
      container.scrollTo({
        top: activeLine.offsetTop - offset,
        behavior: 'smooth',
      });
    }
  }, [currentLine, mode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm font-medium">
        Loading lyrics...
      </div>
    );
  }

  if (!hasLyrics && !plainLyrics) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-sm font-medium italic">
        No lyrics available for this track
      </div>
    );
  }

  if (mode === 'inline') {
    return (
      <div 
        ref={containerRef}
        className="relative h-[120px] overflow-hidden scroll-hide select-none cursor-pointer"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}
        onClick={() => {
          // Trigger fullscreen mode in parent
          if (onClose) onClose(); 
        }}
      >
        <div ref={scrollRef} className="flex flex-col py-10 transition-all duration-300">
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <div
                key={i}
                className="text-center py-2 px-4 transition-all duration-300 ease-out"
                style={{
                  opacity: i === currentLine ? 1 : 0.3,
                  transform: `scale(${i === currentLine ? 1.05 : 1})`,
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: i === currentLine ? 800 : 600,
                }}
              >
                {line.text}
              </div>
            ))
          ) : (
            <div className="text-center text-white/50 text-sm px-4 leading-relaxed">
              {plainLyrics}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen Mode
  return (
    <div className="fixed inset-0 z-[60] flex flex-col pt-16 pb-10 px-8 select-none overflow-hidden">
      {/* Background - Blur current album art */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(${state.currentTrack?.albumArt})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px) brightness(0.2)',
          transform: 'scale(1.2)',
        }}
      />
      <div className="absolute inset-0 -z-10 bg-black/80" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-lg leading-tight truncate max-w-[200px]">
            {state.currentTrack?.title}
          </h2>
          <p className="text-white/60 font-medium text-sm">
            {state.currentTrack?.artist}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>
      </div>

      {/* Lyrics body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-hide max-w-2xl mx-auto w-full"
        style={{ scrollSnapType: 'y proximity' }}
      >
        <div ref={scrollRef} className="flex flex-col py-[20vh]">
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <div
                key={i}
                className="py-4 transition-all duration-300 ease-out cursor-pointer hover:bg-white/5 rounded-lg px-4"
                style={{
                  opacity: i === currentLine ? 1 : i < currentLine ? 0.25 : 0.4,
                  transformOrigin: 'left center',
                  transform: i === currentLine ? 'scale(1.05)' : 'scale(1)',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {line.text}
              </div>
            ))
          ) : (
            <div className="text-white/70 text-xl font-medium leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
