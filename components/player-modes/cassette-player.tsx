'use client';

import React, { useEffect, useRef } from 'react';
import { Track } from '@/lib/types';
import { motion } from 'framer-motion';

interface CassettePlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
}

export function CassettePlayer({ track, isPlaying, progress }: CassettePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    let animationFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);

      // Shell
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 12);
      ctx.fillStyle = '#2a2510'; // Brown-black plastic
      ctx.fill();
      ctx.strokeStyle = '#3a3520';
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(40, 40, w - 80, h - 120);

      // Reel Windows
      const drawReel = (cx: number, cy: number, currentProgress: number, isRight: boolean) => {
        const baseRadius = 15;
        const maxTapeRadius = 25;
        const reelRadius = isRight 
          ? baseRadius + (currentProgress / 100) * maxTapeRadius
          : baseRadius + (1 - currentProgress / 100) * maxTapeRadius;

        // Window background
        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        // Tape reel
        ctx.beginPath();
        ctx.arc(cx, cy, reelRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();

        // spokes
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotationRef.current);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 12);
          ctx.stroke();
          ctx.rotate(Math.PI / 3);
        }
        ctx.restore();

        // Center hub
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
      };

      drawReel(120, h / 2, progress, false);
      drawReel(w - 120, h / 2, progress, true);

      if (isPlaying) {
        rotationRef.current += 0.05;
      }
      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, progress]);

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-10">
      <div className="w-[340px] h-[220px]">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={260} 
          className="w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        />
      </div>

      <div className="text-center font-mono">
        <h2 className="text-xl font-bold text-[#c8a96e] mb-1">{track.title}</h2>
        <p className="text-[#c8a96e]/40 text-sm">{track.artist}</p>
      </div>
    </div>
  );
}
