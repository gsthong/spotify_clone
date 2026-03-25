'use client';

import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import { db } from '@/lib/db';
import { Track } from '@/lib/types';

const LASTFM_KEY = process.env.NEXT_PUBLIC_LASTFM_KEY;
const LASTFM_SECRET = process.env.NEXT_PUBLIC_LASTFM_SECRET;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export function useScrobble() {
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lastfm_session');
    if (saved) {
      setSessionKey(saved);
      setIsConnected(true);
    }
  }, []);

  const generateSignature = useCallback((params: Record<string, string>) => {
    const sortedKeys = Object.keys(params).sort();
    let s = '';
    for (const key of sortedKeys) {
      if (key !== 'format' && key !== 'callback') {
        s += key + params[key];
      }
    }
    s += LASTFM_SECRET || '';
    return CryptoJS.MD5(s).toString();
  }, []);

  const apiRequest = useCallback(async (method: string, params: Record<string, string>, type: 'GET' | 'POST' = 'POST') => {
    if (!LASTFM_KEY || !LASTFM_SECRET || !sessionKey) return null;

    const allParams: Record<string, string> = {
      ...params,
      api_key: LASTFM_KEY,
      method,
      sk: sessionKey,
    };
    allParams.api_sig = generateSignature(allParams);
    allParams.format = 'json';

    try {
      if (type === 'POST') {
        const body = new URLSearchParams(allParams);
        const res = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });
        return await res.json();
      } else {
        const qs = new URLSearchParams(allParams).toString();
        const res = await fetch(`${BASE_URL}?${qs}`);
        return await res.json();
      }
    } catch (err) {
      console.error(`Last.fm ${method} error:`, err);
      return null;
    }
  }, [sessionKey, generateSignature]);

  const updateNowPlaying = useCallback(async (track: Track) => {
    if (!isConnected) return;
    await apiRequest('track.updateNowPlaying', {
      artist: track.artist,
      track: track.title,
    });
  }, [isConnected, apiRequest]);

  const scrobble = useCallback(async (artist: string, track: string, timestamp?: number) => {
    if (!isConnected) return;

    const ts = (timestamp || Math.floor(Date.now() / 1000)).toString();
    const params = { artist, track, timestamp: ts };
    
    const data = await apiRequest('track.scrobble', params);
    
    if (!data || data.error) {
       // Save to offline queue
       await db.scrobble_queue.add({
         trackId: track,
         timestamp: parseInt(ts),
         status: 'pending'
       });
       console.log('[vibe] Scrobble queued (offline)');
    } else {
       console.log('[vibe] Scrobble success:', artist, track);
    }
  }, [isConnected, apiRequest]);

  const loveTrack = useCallback(async (artist: string, track: string, loved: boolean) => {
    if (!isConnected) return;
    await apiRequest(loved ? 'track.love' : 'track.unlove', { artist, track });
  }, [isConnected, apiRequest]);

  const flushQueue = useCallback(async () => {
    if (!isConnected || !navigator.onLine) return;
    const pending = await db.scrobble_queue.toArray();
    if (pending.length === 0) return;

    // Last.fm supports batch scrobbling (up to 50)
    // For simplicity, we'll just process one by one or in small chunks
    for (const item of pending) {
       // We'd need track details from db.tracks using item.trackId
       const track = await db.tracks.get(item.trackId);
       if (track) {
         const data = await apiRequest('track.scrobble', {
           artist: track.artist,
           track: track.title,
           timestamp: item.timestamp.toString()
         });
         if (data && !data.error) {
           await db.scrobble_queue.delete(item.id!);
         }
       }
    }
  }, [isConnected, apiRequest]);

  const connect = useCallback(() => {
    if (!LASTFM_KEY) return;
    const callback = `${window.location.origin}/settings`;
    const url = `https://www.last.fm/api/auth/?api_key=${LASTFM_KEY}&cb=${encodeURIComponent(callback)}`;
    window.location.href = url;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('lastfm_session');
    setSessionKey(null);
    setIsConnected(false);
  }, []);

  const fetchSession = useCallback(async (token: string) => {
    if (!LASTFM_KEY || !LASTFM_SECRET) return;
    const params: Record<string, string> = {
      api_key: LASTFM_KEY,
      method: 'auth.getSession',
      token,
    };
    params.api_sig = generateSignature(params);
    params.format = 'json';

    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE_URL}?${qs}`);
      const data = await res.json();
      if (data.session) {
        localStorage.setItem('lastfm_session', data.session.key);
        setSessionKey(data.session.key);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Last.fm session error:', err);
    }
  }, [generateSignature]);

  return { isConnected, updateNowPlaying, scrobble, loveTrack, flushQueue, connect, disconnect, fetchSession, scrobbleCount: 0 };
}
