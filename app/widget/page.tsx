'use client';

import React from 'react';
import { useAudio } from '@/lib/audio-context';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

export default function WidgetPage() {
  const { state, togglePlay, nextTrack, previousTrack } = useAudio();

  if (!state.currentTrack) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-4">
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Connect Vibe</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black/90 flex items-center p-3 gap-3 overflow-hidden">
      <img 
        src={state.currentTrack.albumArt} 
        alt="" 
        className="w-12 h-12 rounded-lg object-cover shadow-lg"
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-black truncate">{state.currentTrack.title}</p>
        <p className="text-white/40 text-[10px] font-bold truncate uppercase tracking-tight">{state.currentTrack.artist}</p>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={previousTrack} className="p-2 text-white/60 hover:text-white">
          <SkipBack size={16} fill="currentColor" />
        </button>
        <button 
          onClick={togglePlay} 
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
        >
          {state.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
        <button onClick={nextTrack} className="p-2 text-white/60 hover:text-white">
          <SkipForward size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
