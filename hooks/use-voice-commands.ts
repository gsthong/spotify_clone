'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '@/lib/audio-context';

export function useVoiceCommands() {
  const { togglePlay, nextTrack, previousTrack, setVolume, toggleMute, smartShuffle, play, state } = useAudio();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const processCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase();
    console.log('[voice] Command:', cmd);

    if (cmd.includes('tiếp theo') || cmd.includes('next')) {
      nextTrack();
    } else if (cmd.includes('dừng lại') || cmd.includes('pause') || cmd.includes('đợi đã')) {
      togglePlay();
    } else if (cmd.includes('phát') || cmd.includes('play')) {
       // Simple search integration could go here
       togglePlay();
    } else if (cmd.includes('trước đó') || cmd.includes('previous')) {
      previousTrack();
    } else if (cmd.includes('tắt tiếng') || cmd.includes('mute')) {
      toggleMute();
    } else if (cmd.includes('shuffle')) {
      smartShuffle(null);
    }
  }, [nextTrack, previousTrack, togglePlay, toggleMute, smartShuffle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.trim();
      processCommand(text);
    };

    recognitionRef.current = recognition;

    // Wake word detection (pseudo implementation)
    // In a real app, you'd use a small model or highly optimized keyword spotter
    // Here we use the SpeechRecognition itself
  }, [processCommand]);

  const startListening = () => {
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return { isListening, startListening, stopListening };
}
