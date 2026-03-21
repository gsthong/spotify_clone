'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function TerminalPlayerPage() {
  const { state, togglePlay, nextTrack, previousTrack, play, setQueue } = useAudio();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['VIBE OS v4.0.0', 'Type "help" to see available commands.', '']);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const args = cmd.split(' ');
    const baseCmd = args[0];

    const newHistory = [...history, `> ${input}`];

    switch (baseCmd) {
      case 'help':
        newHistory.push(
          'Available commands:',
          '  play        - Toggle playback',
          '  next        - Skip to next track',
          '  prev        - Skip to previous track',
          '  list        - List current queue',
          '  now         - Show current track info',
          '  clear       - Clear terminal history'
        );
        break;
      case 'play':
        togglePlay();
        newHistory.push(state.isPlaying ? 'Paused playback.' : 'Starting playback...');
        break;
      case 'next':
        nextTrack();
        newHistory.push('Skipping to next track...');
        break;
      case 'prev':
        previousTrack();
        newHistory.push('Returning to previous track...');
        break;
      case 'now':
        if (state.currentTrack) {
          newHistory.push(
            `Currently Playing: ${state.currentTrack.title}`,
            `Artist: ${state.currentTrack.artist}`,
            `Progress: ${formatTime(state.currentTime)} / ${formatTime(state.currentTrack.duration)}`
          );
        } else {
          newHistory.push('Nothing playing.');
        }
        break;
      case 'list':
        if (state.queue.length > 0) {
          newHistory.push('Current Queue:', ...state.queue.map((t, i) => `${i === state.currentIndex ? '*' : ' '} [${i}] ${t.title} - ${t.artist}`));
        } else {
          newHistory.push('Queue is empty.');
        }
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      default:
        newHistory.push(`Command not found: ${baseCmd}. Type "help" for options.`);
    }

    setHistory([...newHistory, '']);
    setInput('');
  };

  return (
    <div className="h-screen bg-black text-[#0f0] font-mono p-6 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 custom-scrollbar whitespace-pre-wrap leading-relaxed">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-white' : ''}>
            {line}
          </div>
        ))}
        {state.isPlaying && (
          <div className="mt-4 p-4 border border-[#0f0]/30 rounded bg-[#0f0]/5">
             <div className="flex justify-between mb-2">
               <span>NOW PLAYING: {state.currentTrack?.title}</span>
               <span>{formatTime(state.currentTime)} / {formatTime(state.currentTrack?.duration ?? 0)}</span>
             </div>
             <div className="w-full h-1 bg-[#0f0]/20">
                <motion.div 
                  className="h-full bg-[#0f0]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(state.currentTime / (state.currentTrack?.duration ?? 1)) * 100}%` }}
                />
             </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleCommand} className="flex items-center gap-2">
        <span className="shrink-0 text-[#0f0] font-black">vibe@os:~$</span>
        <input 
          autoFocus
          className="bg-transparent border-none outline-none flex-1 text-white caret-[#0f0]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
