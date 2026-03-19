'use client';

import { useState, useEffect, useCallback } from 'react';

const LASTFM_KEY = process.env.NEXT_PUBLIC_LASTFM_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

interface ArtistInfo {
  bio: string;
  topTracks: Array<{ name: string; playcount: string; url: string }>;
  similarArtists: Array<{ name: string; image: string }>;
}

export function useArtist(artistName: string | null) {
  const [data, setData] = useState<ArtistInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArtistInfo = useCallback(async (name: string) => {
    if (!LASTFM_KEY) return;
    setIsLoading(true);

    try {
      // 1. Get Bio
      const bioRes = await fetch(`${BASE_URL}?method=artist.getInfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&format=json`);
      const bioData = await bioRes.json();
      
      // 2. Get Top Tracks
      const tracksRes = await fetch(`${BASE_URL}?method=artist.getTopTracks&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&format=json&limit=5`);
      const tracksData = await tracksRes.json();

      // 3. Get Similar Artists
      const similarRes = await fetch(`${BASE_URL}?method=artist.getSimilar&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&format=json&limit=5`);
      const similarData = await similarRes.json();

      const bio = bioData.artist?.bio?.summary 
        ? bioData.artist.bio.summary.replace(/<[^>]*>/g, '').split('Read more on Last.fm')[0].trim()
        : 'No biography available.';

      const topTracks = tracksData.toptracks?.track?.map((t: any) => ({
        name: t.name,
        playcount: t.playcount,
        url: t.url
      })) || [];

      const similarArtists = similarData.similarartists?.artist?.map((a: any) => ({
        name: a.name,
        image: a.image?.[2]?.['#text'] || ''
      })) || [];

      setData({
        bio: bio.length > 350 ? bio.substring(0, 350) + '...' : bio,
        topTracks,
        similarArtists
      });
    } catch (err) {
      console.error('useArtist error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (artistName) {
      fetchArtistInfo(artistName);
    }
  }, [artistName, fetchArtistInfo]);

  return { ...data, isLoading };
}
