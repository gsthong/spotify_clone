'use client';

import { useEffect, useState } from 'react';
import { ColorPalette } from '@/lib/types';

export function useColorExtraction(imageUrl: string | null): ColorPalette {
  const [palette, setPalette] = useState<ColorPalette>({
    vibrant: '#8B5CF6',
    muted: '#6B7280',
    darkVibrant: '#6D28D9',
    lightVibrant: '#A78BFA',
  });

  useEffect(() => {
    if (!imageUrl) return;

    // Simulate color extraction with dynamic color generation
    // In a real app, you'd use node-vibrant to extract from the image
    const extractColors = async () => {
      try {
        // For demo purposes, we'll use a simple color generation
        // In production, integrate with node-vibrant
        const hash = imageUrl.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);

        const hue = Math.abs(hash) % 360;
        const vibrant = `hsl(${hue}, 70%, 50%)`;
        const darkVibrant = `hsl(${hue}, 70%, 35%)`;
        const lightVibrant = `hsl(${hue}, 70%, 65%)`;
        const muted = `hsl(${hue}, 30%, 50%)`;

        setPalette({
          vibrant,
          muted,
          darkVibrant,
          lightVibrant,
        });
      } catch (error) {
        console.error('[v0] Color extraction error:', error);
      }
    };

    extractColors();
  }, [imageUrl]);

  return palette;
}
