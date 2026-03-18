'use client';

import { useCallback } from 'react';
import { Track } from '@/lib/types';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration: number;
}

export function useYouTubeSearch() {
  const search = useCallback(async (query: string): Promise<Track[]> => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`${PROXY_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data: SearchResult[] = await res.json();
      return data.map(
        (item): Track => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          album: item.album || 'YouTube Music',
          duration: item.duration,
          albumArt: item.thumbnail,
          url: '',
          mood: 'hype',
          plays: 0,
        })
      );
    } catch {
      return [];
    }
  }, []);

  return { search };
}
