'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';

export function NightDrivePlayer() {
  const { state, togglePlay, setPlayerMode, analyserRef } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showControls, setShowControls] = React.useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      size: Math.random() * 2,
      opacity: Math.random()
    }));

    const buildings = Array.from({ length: 20 }, (_, i) => ({
      x: i * 0.1,
      width: 0.05 + Math.random() * 0.1,
      height: 0.1 + Math.random() * 0.3,
      windows: Array.from({ length: 5 }, () => ({
        wx: Math.random(),
        wy: Math.random(),
        lit: Math.random() > 0.7
      }))
    }));

    let dashOffset = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);

      analyser.getByteFrequencyData(dataArray);
      const bassEnergy = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / (10 * 255);
      
      const speed = 5 + bassEnergy * 20;
      dashOffset = (dashOffset + speed) % 100;

      // SKY
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      skyGrad.addColorStop(0, '#000005');
      skyGrad.addColorStop(1, '#0a0015');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.6);

      // STARS
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * (0.5 + bassEnergy * 0.5)})`;
        ctx.fillRect(star.x * w, star.y * h, star.size, star.size);
      });

      // CITY SKYLINE (Parallax)
      const horizonY = h * 0.6;
      buildings.forEach(b => {
        const bx = ((b.x - Date.now() * 0.00005) % 2 + 2) % 2 * w - w;
        const bw = b.width * w;
        const bh = b.height * horizonY;
        
        ctx.fillStyle = '#050010';
        ctx.fillRect(bx, horizonY - bh, bw, bh);
        
        b.windows.forEach(win => {
          if (win.lit) {
            ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
            ctx.fillRect(bx + win.wx * bw, horizonY - win.wy * bh, 2, 2);
          }
        });
      });

      // ROAD
      ctx.fillStyle = '#0d0d0d';
      ctx.beginPath();
      ctx.moveTo(w * 0.45, horizonY);
      ctx.lineTo(w * 0.55, horizonY);
      ctx.lineTo(w * 1.2, h);
      ctx.lineTo(-w * 0.2, h);
      ctx.fill();

      // LANE MARKERS (Dashes)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([40, 60]);
      ctx.lineDashOffset = -dashOffset * 5;
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();

      // DASHBOARD SILHOUETTE
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.9, h * 0.85);
      ctx.quadraticCurveTo(w * 0.5, h * 0.8, w * 0.1, h * 0.85);
      ctx.fill();

      // BEAT FEEDBACK (Camera shake)
      if (bassEnergy > 0.8) {
        ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* HUD style Track Info */}
      <div className="absolute top-12 right-12 text-right pointer-events-none">
         <motion.div 
          key={state.currentTrack?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10"
         >
           <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Now Playing</p>
           <h2 className="text-2xl font-black text-white">{state.currentTrack?.title}</h2>
           <p className="text-sm font-bold text-white/60">{state.currentTrack?.artist}</p>
         </motion.div>
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 p-12 flex justify-between items-end"
          >
            <button 
              onClick={() => setPlayerMode('default')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs transition-colors"
            >
              Exit Drive
            </button>
            <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
              >
                {state.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .cursor-none { cursor: ${showControls ? 'default' : 'none'}; }
      `}</style>
    </div>
  );
}
