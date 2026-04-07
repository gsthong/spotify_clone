'use client';

import React, { useRef, useEffect } from 'react';
import { useAudio } from '@/lib/audio-context';

interface FrequencyVisualizerProps {
  className?: string;
  barColor?: string;
  gap?: number;
  barWidth?: number;
  sensitivity?: number;
  mode?: 'bars' | 'wave' | 'compact';
}

export function FrequencyVisualizer({
  className = '',
  barColor = 'var(--color-accent)',
  gap = 2,
  barWidth = 4,
  sensitivity = 1,
  mode = 'bars',
}: FrequencyVisualizerProps) {
  const { analyserRef, state } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = analyserRef.current;
      if (!analyser || !state.isPlaying) {
        // Clear canvas if not playing or no analyser
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Ensure canvas matches its display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      if (mode === 'bars') {
        const totalBarWidth = barWidth + gap;
        const barsCount = Math.floor(width / totalBarWidth);
        const step = Math.floor(bufferLength / barsCount);

        for (let i = 0; i < barsCount; i++) {
          const dataIndex = i * step;
          let val = dataArray[dataIndex] || 0;
          
          // Apply sensitivity and normalize
          val = (val / 255) * height * sensitivity;
          
          const x = i * totalBarWidth;
          const y = height - val;

          // Drawing bar with gradient
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, barColor + '33'); // Transparent bottom
          gradient.addColorStop(1, barColor); // Solid top

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, val, [2, 2, 0, 0]);
          ctx.fill();

          // Add a "bloom" cap
          if (val > 10) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = barColor;
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, barWidth, 2);
            ctx.shadowBlur = 0;
          }
        }
      } else if (mode === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = barColor;
        
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyserRef, state.isPlaying, barColor, gap, barWidth, sensitivity, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}
