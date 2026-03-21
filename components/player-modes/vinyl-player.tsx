'use client';

import React, { useEffect, useRef } from 'react';
import { Track } from '@/lib/types';
import { motion } from 'framer-motion';

interface VinylPlayerProps {
  track: Track;
  isPlaying: boolean;
}

export function VinylPlayer({ track, isPlaying }: VinylPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Outer Vinyl
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fillStyle = '#121212';
      ctx.fill();
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Grooves
      for (let r = 80; r < 175; r += 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.stroke();
      }

      // Label (Album Art will be overlaid via CSS for better quality/animation)
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      // Shine
      const gradient = ctx.createRadialGradient(cx - 50, cy - 50, 0, cx, cy, 180);
      gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Center hole
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    };

    draw();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      <div className="relative w-[360px] h-[360px]">
        {/* Tonearm */}
        <div 
          className="absolute -right-4 top-0 z-20 transition-transform duration-1000 origin-[90%_10%]"
          style={{ transform: isPlaying ? 'rotate(15deg)' : 'rotate(-10deg)' }}
        >
          <svg width="120" height="240" viewBox="0 0 120 240" fill="none">
             <path d="M100 20 L40 220" stroke="#444" strokeWidth="8" strokeLinecap="round" />
             <circle cx="100" cy="20" r="15" fill="#222" />
             <rect x="35" y="210" width="10" height="20" fill="#666" transform="rotate(20 40 220)" />
          </svg>
        </div>

        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          className="w-full h-full relative"
        >
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            className="w-full h-full"
          />
          {/* Album Art Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[130px] h-[130px] rounded-full overflow-hidden border-2 border-black">
              <img src={track.albumArt} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute w-3 h-3 bg-black rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="mt-12 text-center max-w-sm">
        <h2 className="text-2xl font-black text-white truncate">{track.title}</h2>
        <p className="text-white/40 font-bold">{track.artist}</p>
      </div>
    </div>
  );
}
