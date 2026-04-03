'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, MoreHorizontal, Heart } from 'lucide-react';
import { Track } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListPlus, Share2, Radio, User, Trash2 } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { VibeTooltip } from './vibe-tooltip';

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

export function TrackRow({ track, index, isPlaying, isCurrent, onClick }: TrackRowProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group transition-all duration-200 ${isCurrent ? 'bg-white/5' : 'hover:bg-white/10'}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div style={{ width: '16px', textAlign: 'center', fontSize: '14px', color: isCurrent ? 'var(--sp-green)' : '#b3b3b3' }}>
        {isCurrent && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-3">
            {[0.6, 0.8, 0.7].map((dur, i) => (
              <motion.div
                key={i}
                animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                transition={{ repeat: Infinity, duration: dur, ease: "easeInOut" }}
                className="bg-current shadow-[0_0_8px_var(--sp-green)]"
                style={{ width: '2.5px', backgroundColor: 'var(--sp-green)', borderRadius: '1.5px' }}
              />
            ))}
          </div>
        ) : isCurrent ? (
          <Play size={12} fill="var(--sp-green)" strokeWidth={0} className="animate-pulse" />
        ) : (
          <span className="group-hover:hidden font-medium">{index + 1}</span>
        )}
        {!isCurrent && (
          <Play size={12} fill="white" strokeWidth={0} className="hidden group-hover:block mx-auto transform scale-110" />
        )}
      </div>

      <div className="relative flex-shrink-0">
        <img
          src={track.albumArt}
          alt=""
          className="shadow-lg group-hover:shadow-black/40 transition-shadow"
          style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
        />
        {isCurrent && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[4px]">
             {isPlaying ? <Pause size={16} fill="white" strokeWidth={0} /> : <Play size={16} fill="white" strokeWidth={0} />}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-premium transition-colors"
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: isCurrent ? 'var(--sp-green)' : 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.title}
        </p>
        <p
          className="hover:underline"
          style={{
            fontSize: '13px',
            color: isCurrent ? 'rgba(29, 185, 84, 0.7)' : '#b3b3b3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '2px',
          }}
        >
          {track.artist}
        </p>
      </div>

      <p className="hidden lg:block flex-1 text-sm text-[#b3b3b3] truncate font-medium">
        {track.title}
      </p>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
        <VibeTooltip content="Add to Liked Songs">
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <Heart size={16} className="hover:scale-110 active:scale-90 transition-transform" />
          </button>
        </VibeTooltip>
        
        <span style={{ fontSize: '13px', color: '#b3b3b3', minWidth: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(track.duration)}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[#b3b3b3] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl" align="end">
            <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">
              <ListPlus className="mr-2 h-4 w-4" />
              <span>Add to queue</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">
              <Radio className="mr-2 h-4 w-4" />
              <span>Go to radio</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">
              <User className="mr-2 h-4 w-4" />
              <span>Go to artist</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
