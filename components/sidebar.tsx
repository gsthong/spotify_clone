'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Home, Search, Library, Plus, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { play, setQueue } = useAudio();

  return (
    <aside
      className="flex flex-col h-full gap-2"
      style={{ width: '240px', flexShrink: 0 }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-6 pt-6 pb-4"
        style={{ backgroundColor: 'var(--sp-sidebar)' }}
      >
        <svg viewBox="0 0 167 50" width="100" height="30" fill="white">
          <path d="M83.996.277C37.747.277.253 37.77.253 84.019c0 46.252 37.494 83.741 83.743 83.741 46.254 0 83.744-37.489 83.744-83.741 0-46.246-37.49-83.738-83.744-83.742zm38.404 120.78a5.217 5.217 0 01-7.18 1.73c-19.662-12.01-44.414-14.73-73.564-8.07a5.222 5.222 0 01-6.249-3.93 5.213 5.213 0 013.926-6.25c31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-.903-8.148-4.35a6.538 6.538 0 014.354-8.143c30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-.001zm.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219a7.814 7.814 0 015.221-9.771c29.581-8.98 78.756-7.245 109.83 11.202a7.816 7.816 0 012.74 10.714 7.81 7.81 0 01-10.73 2.758z"/>
        </svg>
      </div>

      {/* Main nav */}
      <nav
        className="px-3 pb-4 pt-2"
        style={{ backgroundColor: 'var(--sp-sidebar)' }}
      >
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <div
                className="flex items-center gap-4 px-3 py-2 rounded-md transition-colors"
                style={{
                  color: active ? 'var(--sp-text-primary)' : 'var(--sp-text-secondary)',
                  fontWeight: active ? 700 : 400,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)'; }}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: '14px' }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Library */}
      <div
        className="flex-1 rounded-lg flex flex-col overflow-hidden mx-2"
        style={{ backgroundColor: 'var(--sp-bg-elevated)' }}
      >
        {/* Library header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            className="flex items-center gap-2 transition-colors"
            style={{ color: 'var(--sp-text-secondary)', fontWeight: 700, fontSize: '14px' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)')}
          >
            <Library size={22} />
            Your Library
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ color: 'var(--sp-text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sp-text-secondary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Liked Songs card */}
        <div className="px-2 pb-2">
          <motion.div
            onClick={() => { setQueue(MOCK_TRACKS, 0); play(MOCK_TRACKS[0]); }}
            className="flex items-center gap-3 p-2 rounded-md cursor-pointer"
            style={{ transition: 'background 0.1s' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
          >
            {/* Gradient thumb */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '48px', height: '48px', borderRadius: '4px',
                background: 'linear-gradient(135deg, #450af5, #c4efd9)',
              }}
            >
              <Heart size={20} fill="white" strokeWidth={0} />
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Liked Songs</p>
              <p style={{ fontSize: '12px', color: 'var(--sp-text-secondary)' }}>Playlist · {MOCK_TRACKS.length} songs</p>
            </div>
          </motion.div>
        </div>

        {/* Track list in library */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {MOCK_TRACKS.map((track, i) => (
            <motion.div
              key={track.id}
              onClick={() => { setQueue(MOCK_TRACKS, i); play(track); }}
              className="flex items-center gap-3 p-2 rounded-md cursor-pointer"
              style={{ transition: 'background 0.1s' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <img
                src={track.albumArt}
                alt=""
                style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
              />
              <div className="min-w-0">
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--sp-text-secondary)' }}>{track.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </aside>
  );
}
