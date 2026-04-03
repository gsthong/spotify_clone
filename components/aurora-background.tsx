'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AuroraBackgroundProps {
  color?: string;
  opacity?: number;
}

export function AuroraBackground({ color = 'var(--color-accent)', opacity = 0.5 }: AuroraBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute"
        style={{
          width: '150%',
          height: '150%',
          top: '-25%',
          left: '-25%',
          background: `radial-gradient(circle at 50% 50%, ${color}44, transparent 70%)`,
          filter: 'blur(100px)',
          opacity,
        }}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.2, 0.9, 1],
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
          background: `radial-gradient(circle at 50% 50%, #ffffff11, transparent 60%)`,
          filter: 'blur(80px)',
          opacity: opacity * 0.5,
        }}
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 50, -50, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
          backdropFilter: 'brightness(0.8)',
        }}
      />
    </div>
  );
}
