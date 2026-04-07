'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';

interface AuroraBackgroundProps {
  color?: string;
  opacity?: number;
  reactive?: boolean;
}

export function AuroraBackground({ 
  color = 'var(--color-accent)', 
  opacity = 0.5,
  reactive = true 
}: AuroraBackgroundProps) {
  const { analyserRef, state } = useAudio();
  const [intensity, setIntensity] = useState(0);
  
  // Smooth out the intensity changes
  const springIntensity = useSpring(0, { stiffness: 100, damping: 20 });
  
  useEffect(() => {
    if (!reactive || !state.isPlaying) {
      springIntensity.set(0);
      return;
    }

    let rafId: number;
    const updateIntensity = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume (RMS-ish)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize to 0-1 (255 is max)
        const normalized = Math.min(1, avg / 120); 
        springIntensity.set(normalized);
        setIntensity(normalized);
      }
      rafId = requestAnimationFrame(updateIntensity);
    };

    updateIntensity();
    return () => cancelAnimationFrame(rafId);
  }, [reactive, state.isPlaying, analyserRef]);

  // Derived reactive values
  const scale = useTransform(springIntensity, [0, 1], [1, 1.4]);
  const blur = useTransform(springIntensity, [0, 1], [80, 40]); // Sharper when louder
  const brightness = useTransform(springIntensity, [0, 1], [0.8, 1.2]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute"
        style={{
          width: '150%',
          height: '150%',
          top: '-25%',
          left: '-25%',
          background: `radial-gradient(circle at 40% 40%, ${color}66, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: opacity * 1.2,
          scale,
        }}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute"
        style={{
          width: '120%',
          height: '120%',
          bottom: '-10%',
          right: '-10%',
          background: `radial-gradient(circle at 60% 60%, #ffffff22, transparent 60%)`,
          filter: 'blur(80px)',
          opacity: opacity * 0.6,
          scale: useTransform(springIntensity, [0, 1], [1, 1.2]),
        }}
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)',
          backdropFilter: 'brightness(0.8)',
        }}
        animate={{
          backgroundColor: state.isPlaying ? `rgba(0,0,0,${0.4 - intensity * 0.2})` : 'rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
