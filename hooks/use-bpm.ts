'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';

export function useBPM() {
  const { state, audioRef } = useAudio();
  const [bpm, setBPM] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const lastPeakTimeRef = useRef<number>(0);
  const peakIntervalsRef = useRef<number[]>([]);
  const thresholdRef = useRef<number>(180);
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    if (!audioRef.current || analyserRef.current) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audioRef.current);
      const analyser = audioCtx.createAnalyser();
      
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Web Audio API not supported or already connected:', err);
    }
  }, [audioRef]);

  useEffect(() => {
    if (!state.isPlaying || !analyserRef.current || !dataArrayRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const detectPeak = () => {
      const analyser = analyserRef.current!;
      const dataArray = dataArrayRef.current!;
      analyser.getByteFrequencyData(dataArray as any);

      // Focus on bass frequencies (bins 1-10)
      let energy = 0;
      for (let i = 1; i <= 10; i++) {
        energy += dataArray[i];
      }
      energy /= 10;

      // Adaptive threshold
      thresholdRef.current = thresholdRef.current * 0.95 + energy * 0.05;
      const peakThreshold = thresholdRef.current * 1.4;

      if (energy > peakThreshold && energy > 50) {
        const now = performance.now();
        const interval = now - lastPeakTimeRef.current;

        if (interval > 333) { // Min 333ms (180 BPM)
          if (lastPeakTimeRef.current > 0) {
            peakIntervalsRef.current.push(interval);
            if (peakIntervalsRef.current.length > 8) peakIntervalsRef.current.shift();

            if (peakIntervalsRef.current.length >= 4) {
              const sorted = [...peakIntervalsRef.current].sort((a, b) => a - b);
              const medianInterval = sorted[Math.floor(sorted.length / 2)];
              const calculatedBPM = Math.round(60000 / medianInterval);

              if (calculatedBPM >= 60 && calculatedBPM <= 180) {
                setBPM(prev => {
                  if (prev === null) return calculatedBPM;
                  // Only update if difference is within 15%
                  const diff = Math.abs(calculatedBPM - prev) / prev;
                  return diff < 0.15 ? calculatedBPM : prev;
                });
                
                // Confidence based on variance
                const avg = peakIntervalsRef.current.reduce((a, b) => a + b) / peakIntervalsRef.current.length;
                const variance = peakIntervalsRef.current.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / peakIntervalsRef.current.length;
                setConfidence(Math.max(0, 1 - Math.sqrt(variance) / 100));

                // Dispatch event for Shake effect
                window.dispatchEvent(new CustomEvent('vibe-beat'));
              }
            }
          }
          lastPeakTimeRef.current = now;
        }
      }
      animationFrameRef.current = requestAnimationFrame(detectPeak);
    };

    detectPeak();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [state.isPlaying]);

  return { bpm, confidence };
}
