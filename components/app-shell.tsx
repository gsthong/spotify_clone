'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { PlayerBar } from './player-bar';
import { NowPlayingScreen } from './now-playing-screen';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col" style={{ height: '100vh', backgroundColor: '#000' }}>
      {/* Top area: sidebar + main */}
      <div className="flex flex-1 gap-2 overflow-hidden p-2 pb-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div
          className="flex-1 rounded-lg overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--sp-bg)' }}
        >
          {/* Top nav bar */}
          <div
            className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
          >
            <div className="flex gap-2">
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
              >
                ‹
              </button>
              <button
                onClick={() => window.history.forward()}
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
              >
                ›
              </button>
            </div>

            {/* Stats link in top right */}
            <Link href="/stats">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: pathname === '/stats' ? 'white' : 'rgba(0,0,0,0.6)',
                  color: pathname === '/stats' ? 'black' : 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <BarChart2 size={16} />
                Stats
              </div>
            </Link>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>

      {/* Player bar */}
      <PlayerBar />

      {/* Full screen now playing overlay */}
      <NowPlayingScreen />
    </div>
  );
}
