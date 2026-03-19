'use client';

import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';

const LASTFM_KEY = process.env.NEXT_PUBLIC_LASTFM_KEY;
const LASTFM_SECRET = process.env.NEXT_PUBLIC_LASTFM_SECRET; // User should add this to .env
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export function useScrobble() {
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scrobbleCount, setScrobbleCount] = useState(0);

  // Load session from local storage on mount
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

  const scrobble = useCallback(async (artist: string, track: string) => {
    if (!isConnected || !sessionKey || !LASTFM_KEY || !LASTFM_SECRET) return;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = {
      api_key: LASTFM_KEY,
      artist,
      method: 'track.scrobble',
      sk: sessionKey,
      timestamp,
      track,
    };
    params.api_sig = generateSignature(params);
    params.format = 'json';

    try {
      const body = new URLSearchParams(params);
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const data = await res.json();
      if (data.scrobbles) {
        setScrobbleCount(prev => prev + 1);
        console.log('[vibe] Scrobble successful:', artist, track);
      }
    } catch (err) {
      console.error('Scrobble error:', err);
    }
  }, [isConnected, sessionKey, generateSignature]);

  return { isConnected, connect, disconnect, scrobble, scrobbleCount, fetchSession };
}
