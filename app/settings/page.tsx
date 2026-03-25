'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, LogOut, Trash2, Globe, Heart, ChevronRight, Settings as SettingsIcon, Download, Upload, MessageSquare, Mic, Users, Bell } from 'lucide-react';
import { useAudio } from '@/lib/audio-context';
import { useScrobble } from '@/hooks/use-scrobble';
import { useVoiceCommands } from '@/hooks/use-voice-commands';
import { db } from '@/lib/db';
import { AmbientMixer } from '@/components/ambient-mixer';
import { SpotifyImport } from '@/components/spotify-import';
import { exportLibrary, importLibrary, downloadFile } from '@/lib/backup';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setTheme, setSpatialPreset } = useAudio();
  const { isConnected, connect, disconnect, fetchSession, scrobbleCount } = useScrobble();
  const { isListening, startListening, stopListening } = useVoiceCommands();

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
              {/* Last.fm */}
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

              {/* Discord RPC */}
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold">Discord Rich Presence</p>
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-0.5">Desktop only</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-white/20 text-[10px] font-bold">Bridge required</p>
                </div>
              </div>

              {/* Lyric Notifications */}
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold">Lyric Notifications</p>
                    <p className="text-white/40 text-xs">Desktop & Android Chrome</p>
                  </div>
                </div>
                <button 
                  onClick={() => Notification.requestPermission()} 
                  className="px-4 py-2 rounded-full bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10"
                >
                  Enable
                </button>
              </div>

              {/* Voice Commands */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                    <Mic size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold">Voice Commands</p>
                    <p className="text-white/40 text-xs">{isListening ? 'Listening...' : 'Say "Hey Vibe" to control'}</p>
                  </div>
                </div>
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isListening ? 'bg-[var(--sp-green)] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                >
                  {isListening ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">Appearance</h3>
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="text-white font-bold mb-4">Theme</p>
              <div className="grid grid-cols-5 gap-2">
                {['midnight', 'amoled', 'pastel', 'crt', 'neon'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${
                      state.theme === t ? 'border-[var(--sp-green)] scale-110 shadow-[0_0_15px_rgba(29,185,84,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'
                    }`}
                    style={{ background: t === 'amoled' ? '#000' : t === 'midnight' ? '#121212' : t === 'pastel' ? '#1a1520' : t === 'crt' ? '#0a0f0a' : '#080010' }}
                  >
                    <span className={t === 'crt' ? 'text-[#0f0]' : 'text-white'}>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Audio Advanced */}
          <section>
             <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">Audio Advanced</h3>
             <div className="flex flex-col gap-4">
                <div className="bg-white/5 rounded-2xl p-6">
                  <p className="text-white font-bold mb-4">Spatial Preset</p>
                  <div className="flex flex-wrap gap-2">
                    {['off', 'headphones', 'room', 'concert', 'stadium'].map(p => (
                      <button
                        key={p}
                        onClick={() => setSpatialPreset(p)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          state.spatialPreset === p ? 'bg-[var(--sp-green)] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <AmbientMixer />
             </div>
          </section>

          {/* Spotify Import */}
          <section>
            <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-4">Discovery</h3>
            <SpotifyImport />
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

                <div className="border-t border-white/5 flex">
                  <button 
                    onClick={async () => {
                      const data = await exportLibrary();
                      downloadFile(data, `vibe-backup-${Date.now()}.json`, 'application/json');
                    }}
                    className="flex-1 p-6 flex items-center justify-between hover:bg-white/5 transition-colors border-r border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                        <Download size={20} />
                      </div>
                      <p className="text-white font-bold">Export</p>
                    </div>
                  </button>
                  <label className="flex-1 p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".json" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        const res = await importLibrary(text);
                        if (res.success) window.dispatchEvent(new CustomEvent('vibe-toast', { detail: `Imported ${res.count} tracks!` }));
                      }} 
                    />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                        <Upload size={20} />
                      </div>
                      <p className="text-white font-bold">Import</p>
                    </div>
                  </label>
                </div>
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
