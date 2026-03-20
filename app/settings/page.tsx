'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, LogOut, Trash2, Globe, Heart, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { useScrobble } from '@/hooks/use-scrobble';
import { db } from '@/lib/db';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, connect, disconnect, fetchSession, scrobbleCount } = useScrobble();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      fetchSession(token);
      router.replace('/settings');
    }
  }, [searchParams, fetchSession, router]);

  const clearCache = async () => {
    if (confirm('Clear all offline cache and history?')) {
      await db.tracks.clear();
      await db.cache.clear();
      await db.history.clear();
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: 'Cache cleared!' }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e1e1e] to-[#121212] p-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-[var(--sp-green)] flex items-center justify-center text-black">
            <SettingsIcon size={28} />
          </div>
          <h1 className="text-3xl font-black text-white">Settings</h1>
        </header>

        <div className="flex flex-col gap-8">
          {/* Integrations */}
          <section>
            <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">Integrations</h3>
            <div className="bg-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#d51007] flex items-center justify-center text-white">
                    <Music size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold">Last.fm Scrobbling</p>
                    <p className="text-white/40 text-xs">
                      {isConnected ? `Connected • ${scrobbleCount} scrobbles` : 'Connect to track your history'}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <button onClick={disconnect} className="px-4 py-2 rounded-full border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5">
                    Disconnect
                  </button>
                ) : (
                  <button onClick={connect} className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90">
                    Connect
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Storage */}
          <section>
             <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">Storage & Privacy</h3>
             <div className="bg-white/5 rounded-2xl overflow-hidden">
                <button onClick={clearCache} className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                      <Trash2 size={20} />
                    </div>
                    <div>
                       <p className="text-white font-bold">Clear Cache</p>
                       <p className="text-white/40 text-xs">Delete offline tracks and history</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/20" />
                </button>
             </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">About</h3>
            <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/5">
              <h4 className="text-white font-black text-xl mb-6">Vibe</h4>
              <p className="text-white/40 text-xs italic">Minimal Music Player</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
