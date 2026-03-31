'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Home, Search, Library, Plus, Heart, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function Sidebar() {
  const pathname = usePathname();
  const { play, setQueue, state } = useAudio();

  return (
    <aside className="flex flex-col h-full gap-2" style={{ width: '240px', flexShrink: 0 }}>

      {/* Top nav box */}
      <div className="glass rounded-xl px-3 py-4 mb-2">
        {/* Spotify wordmark text (no SVG clipping issues) */}
        <div className="px-3 mb-5">
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
            vibe
          </span>
        </div>

        {[
          { icon: Home, label: 'Home', href: '/' },
          { icon: Search, label: 'Search', href: '/search' },
          { icon: Clock, label: 'History', href: '/history' },
        ].map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <div
                className="flex items-center gap-4 px-3 py-2 rounded-md"
                style={{
                  color: active ? 'white' : '#b3b3b3',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#b3b3b3'; }}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: '15px' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Library box */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden">

        {/* Library header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <button
            className="flex items-center gap-2"
            style={{ color: '#b3b3b3', fontWeight: 700, fontSize: '15px', transition: 'color 0.1s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#b3b3b3')}
          >
            <Library size={22} />
            Your Library
          </button>
          <button
            className="flex items-center justify-center rounded-full"
            style={{ width: '32px', height: '32px', color: '#b3b3b3', transition: 'all 0.1s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'white';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#b3b3b3';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Liked Songs */}
        <div className="px-2 pb-1">
          <motion.div
            onClick={() => { setQueue(MOCK_TRACKS, 0); play(MOCK_TRACKS[0]); }}
            className="flex items-center gap-3 p-2 rounded-md cursor-pointer"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            transition={{ duration: 0.1 }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded"
              style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}
            >
              <Heart size={20} fill="white" strokeWidth={0} />
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Liked Songs</p>
              <p style={{ fontSize: '12px', color: '#b3b3b3' }}>Playlist · {MOCK_TRACKS.length} songs</p>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '4px 16px 8px' }} />

        {/* Tracks in library */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {MOCK_TRACKS.map((track, i) => {
            const isCurrent = state.currentTrack?.id === track.id;
            return (
              <motion.div
                key={track.id}
                onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer"
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                transition={{ duration: 0.1 }}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={track.albumArt}
                    alt=""
                    style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: '14px', fontWeight: 500,
                    color: isCurrent ? '#1db954' : 'white',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {track.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#b3b3b3' }}>{track.artist}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}