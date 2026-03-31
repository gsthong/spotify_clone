'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { PlayerBar } from './player-bar';
import { NowPlayingScreen } from './now-playing-screen';
import { MobileTabBar } from './mobile-tab-bar';
import { MobileMiniPlayer } from './mobile-mini-player';
import { VibeToast } from './vibe-toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── DESKTOP (md and above) ─────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ flexDirection: 'column', height: '100vh', backgroundColor: '#000', gap: '8px' }}
      >
        {/* Main area = sidebar + content */}
        <div style={{ display: 'flex', flex: 1, gap: '8px', overflow: 'hidden', padding: '8px 8px 0 8px' }}>
          <Sidebar />

          {/* Content panel */}
          <div className="glass-card flex-1 flex flex-col overflow-hidden relative" style={{ borderRadius: '8px' }}>
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

              <div className="w-8" />
            </div>

            <main className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-full overflow-y-auto scroll-hide"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
            <VibeToast />
          </div>
        </div>

        <PlayerBar />

        {/* Overlay Screens */}
        <NowPlayingScreen />
        <VibeToast />
      </div>

      {/* ── MOBILE (below md) ──────────────────────────────────── */}
      <div
        className="flex md:hidden"
        style={{
          flexDirection: 'column',
          height: '100dvh',
          backgroundColor: '#121212',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scrollable page content — padded for fixed mini player + tab bar */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            paddingBottom: 'calc(64px + 64px + 16px + env(safe-area-inset-bottom))',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full overflow-y-auto overflow-x-hidden"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mini player sits above tab bar */}
        <MobileMiniPlayer />

        {/* Tab bar */}
        <MobileTabBar />

        {/* Full-screen now playing overlay — same as desktop */}
        <NowPlayingScreen />
      </div>
    </>
  );
}