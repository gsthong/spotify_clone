'use client';

import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/lib/types';
// Phase 1 mentioned Dexie is installed.
import { db } from '../lib/db'; 

export function useOfflineCache() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheTrackMetadata = useCallback(async (track: Track) => {
    try {
      await db.tracks.put({
        ...track,
        cachedAt: Date.now(),
        plays: track.plays || 0
      });
    } catch (err) {
      console.error('Failed to cache track metadata:', err);
    }
  }, []);

  const cacheAlbumArt = useCallback(async (trackId: string, url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await db.cache.put({
        id: `art-${trackId}`,
        data: blob,
        type: 'image',
        createdAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to cache album art:', err);
    }
  }, []);

  return { isOffline, cacheTrackMetadata, cacheAlbumArt };
}
