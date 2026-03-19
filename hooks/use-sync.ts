'use client';

import { useCallback } from 'react';
import QRCode from 'qrcode';

export function useSync() {
  const generateSyncUrl = useCallback((trackId: string, currentTime: number) => {
    return `${window.location.origin}/play?id=${trackId}&t=${Math.floor(currentTime)}`;
  }, []);

  const copySyncLink = useCallback(async (trackId: string, currentTime: number) => {
    const url = generateSyncUrl(trackId, currentTime);
    try {
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: 'Sync link copied!' }));
    } catch (err) {
      console.error('Failed to copy sync link:', err);
    }
  }, [generateSyncUrl]);

  const generateQRCode = useCallback(async (trackId: string, currentTime: number, canvasElement: HTMLCanvasElement) => {
    const url = generateSyncUrl(trackId, currentTime);
    try {
      await QRCode.toCanvas(canvasElement, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1DB954',
          light: '#00000000', // Transparent
        },
      });
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  }, [generateSyncUrl]);

  return { generateSyncUrl, copySyncLink, generateQRCode };
}
