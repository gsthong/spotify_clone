'use client';

import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Track } from '@/lib/types';

export function useShare() {
  const shareTrack = useCallback(async (track: Track, currentTime: number) => {
    const url = `${window.location.origin}/play?id=${track.id}&t=${Math.floor(currentTime)}`;
    const title = `${track.title} — ${track.artist}`;
    const text = `Nghe bài này trên Vibe Music 🎵`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.warn('Web Share failed:', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: 'Link copied to clipboard!' }));
    }
  }, []);

  const generateShareCard = useCallback(async (track: Track, containerId: string, style: 'receipt' | 'polaroid' | 'minimal') => {
    const element = document.getElementById(containerId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        background: '#121212',
        scale: 2,
      } as any);
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-share-${track.title.toLowerCase().replace(/\s+/g, '-')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to generate share card:', err);
    }
  }, []);

  return { shareTrack, generateShareCard };
}
