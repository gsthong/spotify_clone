'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { PlayerBar } from './player-bar';
import { NowPlayingScreen } from './now-playing-screen';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', gap: '8px' }}>

      {/* Main area = sidebar + content, padded */}
      <div style={{ display: 'flex', flex: 1, gap: '8px', overflow: 'hidden', padding: '8px 8px 0 8px' }}>

        {/* Sidebar */}
        <Sidebar />

        {/* Content panel */}
        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#121212' }}>

          {/* Top navigation bar */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 24px', flexShrink: 0,
              backgroundColor: 'rgba(18,18,18,0.85)',
              backdropFilter: 'blur(12px)',
              position: 'sticky', top: 0, zIndex: 10,
            }}
          >
            {/* Back/forward */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => window.history.forward()}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)', color: '#b3b3b3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Right side — stats link */}
            <Link href="/stats">
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 16px', borderRadius: '500px',
                  backgroundColor: pathname === '/stats' ? 'white' : 'rgba(0,0,0,0.6)',
                  color: pathname === '/stats' ? '#121212' : 'white',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <BarChart2 size={15} />
                Stats
              </div>
            </Link>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Player bar — sticks to bottom */}
      <PlayerBar />

      {/* Full screen overlay */}
      <NowPlayingScreen />
    </div>
  );
}