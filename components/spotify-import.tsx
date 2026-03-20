'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Music, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/db';
import { Track } from '@/lib/types';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';

export function SpotifyImport() {
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Check for redirect code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('spotify_code');
    if (code) {
      exchangeToken(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const exchangeToken = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${PROXY_URL}/spotify/token?code=${code}&redirect_uri=${encodeURIComponent(window.location.origin + '/settings')}`);
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        fetchPlaylists(data.access_token);
      }
    } catch (err) {
      setStatus({ message: 'Failed to authenticate with Spotify', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylists = async (tk: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${PROXY_URL}/spotify/playlists?token=${tk}`);
      const data = await res.json();
      setPlaylists(data || []);
    } catch (err) {
      setStatus({ message: 'Failed to fetch playlists', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const importPlaylist = async (playlistId: string) => {
    setImportingId(playlistId);
    setStatus({ message: 'Fetching tracks...', type: 'info' });
    
    try {
      const res = await fetch(`${PROXY_URL}/spotify/playlist?token=${token}&id=${playlistId}`);
      const tracks = await res.json();
      
      setStatus({ message: `Matching ${tracks.length} tracks...`, type: 'info' });
      
      let importedCount = 0;
      for (const t of tracks) {
        // Search on YouTube via proxy
        try {
          const sRes = await fetch(`${PROXY_URL}/search?q=${encodeURIComponent(`${t.artist} ${t.name}`)}`);
          const sData = await sRes.json();
          if (sData[0]) {
            const match = sData[0];
            const newTrack: Track = {
              id: match.id,
              title: t.name,
              artist: t.artist,
              album: '',
              albumArt: t.imageUrl || match.thumbnail,
              duration: match.duration || t.duration,
              url: match.id,
              plays: 0,
              mood: 'chill'
            };
            await db.tracks.put(newTrack);
            importedCount++;
          }
        } catch (e) {
          console.warn('Search match failed for track:', t.name);
        }
      }
      
      setStatus({ message: `Successfully imported ${importedCount} tracks to library`, type: 'success' });
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { message: `Imported ${importedCount} tracks`, type: 'success' } }));
    } catch (err) {
      setStatus({ message: 'Failed to import playlist', type: 'error' });
    } finally {
      setImportingId(null);
    }
  };

  const handleLogin = () => {
    const redirect = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${PROXY_URL}/spotify/auth?redirect=${redirect}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954]">
            <Music size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">Spotify Import</h3>
            <p className="text-xs text-white/40">Import your playlists and match them to YouTube</p>
          </div>
        </div>

        {!token ? (
          <button
            onClick={handleLogin}
            className="bg-[#1db954] text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform"
          >
            Connect Spotify
          </button>
        ) : (
          <button
            onClick={() => setToken(null)}
            className="text-white/40 hover:text-white text-xs"
          >
            Disconnect
          </button>
        )}
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-3 p-3 rounded-lg mb-6 text-sm ${
              status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
              status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {status.type === 'error' && <AlertCircle size={16} />}
            {status.type === 'success' && <CheckCircle2 size={16} />}
            {status.type === 'info' && <Loader2 size={16} className="animate-spin" />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scroll-hide">
        {playlists.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
            {p.imageUrl ? (
              <img src={p.imageUrl} className="w-10 h-10 rounded" alt="" />
            ) : (
              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-white/20">
                <Music size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{p.name}</p>
              <p className="text-[10px] text-white/40">{p.trackCount} tracks</p>
            </div>
            <button
              onClick={() => importPlaylist(p.id)}
              disabled={!!importingId}
              className="opacity-0 group-hover:opacity-100 p-2 text-white/60 hover:text-[#1db954] disabled:opacity-50 transition-all"
            >
              {importingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </button>
          </div>
        ))}
        
        {token && playlists.length === 0 && !isLoading && (
          <div className="col-span-full py-10 text-center text-white/20 text-sm">
            No playlists found
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-white/20" />
        </div>
      )}
    </div>
  );
}
