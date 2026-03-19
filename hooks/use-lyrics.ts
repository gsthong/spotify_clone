'use client';

import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/lib/types';

interface LyricsLine {
  time: number;
  text: string;
}

interface LyricsData {
  lines: LyricsLine[];
  plainLyrics?: string;
}

export function useLyrics(currentTrack: Track | null, currentTime: number) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);

  const fetchLyrics = useCallback(async (track: Track) => {
    setIsLoading(true);
    setHasLyrics(false);
    setLyrics(null);

    try {
      // Check cache (using proxy as first step, can add IndexedDB later)
      const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || '';
      const response = await fetch(
        `${proxyUrl}/lyrics?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}&duration=${track.duration}`
      );

      if (!response.ok) throw new Error('Failed to fetch lyrics');

      const data = await response.json();

      if (data.syncedLyrics) {
        const lines: LyricsLine[] = [];
        const regex = /\[(\d+):(\d+\.\d+)\] (.+)/g;
        let match;

        while ((match = regex.exec(data.syncedLyrics)) !== null) {
          const minutes = parseInt(match[1]);
          const seconds = parseFloat(match[2]);
          lines.push({
            time: minutes * 60 + seconds,
            text: match[3],
          });
        }

        setLyrics({ lines, plainLyrics: data.plainLyrics });
        setHasLyrics(true);
      } else if (data.plainLyrics) {
        setLyrics({ lines: [], plainLyrics: data.plainLyrics });
        setHasLyrics(false); // No synced lyrics, but we have plain text
      } else {
        setHasLyrics(false);
      }
    } catch (err) {
      console.error('useLyrics error:', err);
      setHasLyrics(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack);
    }
  }, [currentTrack?.id, fetchLyrics]);

  // Sync currentLineIndex using currentTime
  useEffect(() => {
    if (!lyrics || lyrics.lines.length === 0) return;

    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    if (index !== -1 && index !== currentLineIndex) {
      setCurrentLineIndex(index);
    }
  }, [currentTime, lyrics, currentLineIndex]);

  return {
    lines: lyrics?.lines || [],
    plainLyrics: lyrics?.plainLyrics,
    currentLine: currentLineIndex,
    hasLyrics,
    isLoading,
  };
}
