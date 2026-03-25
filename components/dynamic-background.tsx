'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/lib/audio-context';
import Vibrant from 'node-vibrant';
import { motion, AnimatePresence } from 'framer-motion';

export function DynamicBackground() {
  const { state } = useAudio();
  const [colors, setColors] = useState<string[]>(['#121212', '#1a1a1a', '#000000']);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!state.currentTrack?.albumArt) return;

    Vibrant.from(state.currentTrack.albumArt)
      .getPalette()
      .then((palette) => {
        const newColors = [
          palette.Vibrant?.hex || '#1db954',
          palette.DarkVibrant?.hex || '#121212',
          palette.Muted?.hex || '#1a1a1a',
          palette.DarkMuted?.hex || '#000000',
        ];
        setColors(newColors);
      })
      .catch(console.error);
  }, [state.currentTrack?.albumArt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.002;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Create a complex mesh-like gradient effect
      const gradient = ctx.createRadialGradient(
        width / 2 + Math.sin(time) * width * 0.3,
        height / 2 + Math.cos(time * 0.8) * height * 0.3,
        0,
        width / 2,
        height / 2,
        width * 0.8
      );

      gradient.addColorStop(0, colors[0] + '44'); // Low opacity
      gradient.addColorStop(0.5, colors[1] + '22');
      gradient.addColorStop(1, '#000000');

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add a second moving "blob"
      const gradient2 = ctx.createRadialGradient(
        width / 2 + Math.cos(time * 1.2) * width * 0.4,
        height / 2 + Math.sin(time * 0.5) * height * 0.4,
        0,
        width / 2,
        height / 2,
        width * 0.6
      );
      gradient2.addColorStop(0, colors[2] + '33');
      gradient2.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [colors]);

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-black">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full opacity-60 filter blur-[80px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
    </div>
  );
}
