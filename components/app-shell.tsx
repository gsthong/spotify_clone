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
import { BarChart2, ChevronLeft, ChevronRight, Search, User, Settings, LogOut, Bell } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
            <header
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 24px', flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)',
                position: 'sticky', top: 0, zIndex: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.history.back()}
                    className="hover:scale-110 transition-transform active:scale-95"
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => window.history.forward()}
                    className="hover:scale-110 transition-transform active:scale-95"
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.7)', color: '#b3b3b3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Desktop Search */}
                <div className="relative group ml-4">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" 
                    size={16} 
                  />
                  <input 
                    type="text" 
                    placeholder="Search for tracks, artists..."
                    className="bg-white/5 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/20 rounded-full py-2 pl-10 pr-4 text-sm w-[280px] lg:w-[400px] transition-all border border-transparent focus:border-white/10"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="text-white/60 hover:text-white transition-colors relative mr-2">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-black" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors border border-white/10">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>UN</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-white/90">User</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100" align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem className="focus:bg-red-900/50 focus:text-red-400 text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

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