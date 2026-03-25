'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';

export function ConcertPlayer() {
  const { state, togglePlay, setPlayerMode, analyserRef } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlayerMode('default');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPlayerMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Beams state
    const beams = [
      { x: 0.2, angle: 0, targetAngle: 0, color: '#fff' },
      { x: 0.4, angle: 0, targetAngle: 0, color: '#ff2d78' },
      { x: 0.6, angle: 0, targetAngle: 0, color: '#00bfff' },
      { x: 0.8, angle: 0, targetAngle: 0, color: '#1db954' },
    ];

    const colors = ['#fff', '#ff2d78', '#00bfff', '#1db954', '#ffaa00'];
    let colorIndex = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);

      analyser.getByteFrequencyData(dataArray);

      // Low frequency energy (bass)
      const bassSum = dataArray.slice(0, 10).reduce((a, b) => a + b, 0);
      const bassEnergy = bassSum / (10 * 255);
      
      // Mid frequency energy
      const midSum = dataArray.slice(10, 100).reduce((a, b) => a + b, 0);
      const midEnergy = midSum / (90 * 255);

      // 1. CLEAR / BACKGROUND
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // STROBE
      if (bassEnergy > 0.8) {
        ctx.fillStyle = `rgba(255, 255, 255, ${bassEnergy * 0.1})`;
        ctx.fillRect(0, 0, w, h);
      }

      // COLOR WASH
      ctx.fillStyle = `rgba(29, 185, 84, ${midEnergy * 0.1})`;
      ctx.fillRect(0, 0, w, h);

      // 2. SPOTLIGHTS
      beams.forEach((beam, i) => {
        const x = beam.x * w;
        const time = Date.now() * 0.001;
        beam.angle = Math.sin(time * 0.5 + i) * 0.3;

        ctx.save();
        ctx.translate(x, 0);
        ctx.rotate(beam.angle);

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        const opacity = 0.2 + (bassEnergy > 0.7 ? 0.3 : 0);
        gradient.addColorStop(0, beam.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(w * 0.2, h);
        ctx.lineTo(-w * 0.2, h);
        ctx.closePath();
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.restore();
      });

      // 3. STAGE REFLECTION
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.scale(1, -0.2);
      ctx.translate(0, -h * 4.5);
      // (Simplified reflection of just the wash)
      ctx.restore();

      // 4. ALBUM ART (Center Stage)
      if (state.currentTrack?.albumArt) {
        const artSize = 250 * (1 + bassEnergy * 0.05);
        const img = new Image();
        img.src = state.currentTrack.albumArt;
        
        ctx.save();
        ctx.translate(w / 2, h / 2 - 50);
        
        // Glow
        ctx.shadowBlur = 40;
        ctx.shadowColor = state.accentColor;
        
        // Border
        ctx.strokeStyle = state.accentColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(-artSize / 2, -artSize / 2, artSize, artSize);
        
        try {
           // We'd need to pre-load or check image completion for real canvas drawImage
           // For now, I'll rely on the fact that it's likely cached soon
           // ctx.drawImage(img, -artSize/2, -artSize/2, artSize, artSize);
        } catch(e) {}
        ctx.restore();
      }

      // 5. CROWD SIMULATION
      const crowdCount = w < 800 ? 100 : 200;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
      for (let i = 0; i < crowdCount; i++) {
        const cx = (i / crowdCount) * w + Math.sin(Date.now() * 0.002 + i) * 10;
        const cy = h - 50 + Math.sin(Date.now() * 0.005 + i) * 5;
        
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hands up
        if ((i % 10 === 0 && bassEnergy > 0.6) || (i % 7 === 0 && midEnergy > 0.5)) {
          ctx.strokeStyle = 'rgba(10, 10, 10, 0.9)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx - 5, cy - 10);
          ctx.lineTo(cx - 15, cy - 40);
          ctx.moveTo(cx + 5, cy - 10);
          ctx.lineTo(cx + 15, cy - 40);
          ctx.stroke();
        }
      }

      // 6. STAGE FLOOR
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, h - 40, w, 40);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [state.currentTrack, state.accentColor]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[60] bg-black overflow-hidden select-none cursor-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Track Info Overlay - In-Canvas style or HTML overlay */}
      <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
        <motion.h1 
          key={state.currentTrack?.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black text-white uppercase tracking-tighter filter blur-[0.5px]"
          style={{ textShadow: `0 0 20px ${state.accentColor}66` }}
        >
          {state.currentTrack?.title}
        </motion.h1>
        <p className="text-xl font-bold text-white/40 uppercase tracking-widest mt-2">
          {state.currentTrack?.artist}
        </p>
      </div>

      {/* Album Art HTML Overlay (simpler than canvas drawImage for pre-loading) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-32">
        <motion.div 
          animate={{ scale: state.isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-[300px] h-[300px] rounded-lg overflow-hidden border-2 border-white/20 relative"
          style={{ boxShadow: `0 0 50px ${state.accentColor}44` }}
        >
          {state.currentTrack?.albumArt && (
            <img src={state.currentTrack.albumArt} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 p-8 flex justify-between items-start cursor-default"
          >
            <button 
              onClick={() => setPlayerMode('default')}
              className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex gap-4">
               <button 
                onClick={togglePlay}
                className="p-4 rounded-full bg-white text-black hover:scale-105 transition-transform"
              >
                {state.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .cursor-none { cursor: ${showControls ? 'default' : 'none'}; }
      `}</style>
    </div>
  );
}
