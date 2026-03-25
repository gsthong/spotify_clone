'use client';

import { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';

export function useDiscordRpc() {
  const { state } = useAudio();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:6463');
      
      ws.onopen = () => {
        console.log('[discord] Connected to bridge');
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { message: 'Discord Connected 🎮', type: 'success' } }));
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Silent reconnect attempt
        setTimeout(connect, 10000);
      };

      wsRef.current = ws;
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !state.currentTrack) return;

    wsRef.current.send(JSON.stringify({
      type: 'updatePresence',
      track: state.currentTrack.title,
      artist: state.currentTrack.artist,
      album: state.currentTrack.album,
      duration: state.currentTrack.duration,
      currentTime: state.currentTime,
      isPlaying: state.isPlaying
    }));
  }, [state.currentTrack?.id, state.isPlaying, state.currentTime]); // Optimization: sync every 1s is fine
}
