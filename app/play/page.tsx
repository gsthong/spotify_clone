'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAudio } from '@/lib/audio-context';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Loader2 } from 'lucide-react';

function PlayHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { play, setQueue, seek } = useAudio();

  useEffect(() => {
    const id = searchParams.get('id');
    const time = searchParams.get('t');

    if (id) {
      // Find track in mock data or search if not found
      // For now, check mock data
      const track = MOCK_TRACKS.find(t => t.id === id);
      
      if (track) {
        setQueue([track], 0);
        play(track);
        if (time) {
          seek(parseFloat(time));
        }
        
        // Show resume toast
        window.dispatchEvent(new CustomEvent('vibe-toast', { 
          detail: `Resuming: ${track.title}` 
        }));

        // Redirect back home after a short delay
        setTimeout(() => {
          router.replace('/');
        }, 1000);
      } else {
        // If not in mock data, maybe search?
        // For now just redirect home
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
  }, [searchParams, play, setQueue, seek, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#121212] text-white">
      <Loader2 className="w-10 h-10 text-[var(--sp-green)] animate-spin mb-4" />
      <p className="text-lg font-bold">Syncing your music...</p>
      <p className="text-sm text-white/50 mt-2">Vibe Music Cross-Platform Sync</p>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayHandler />
    </Suspense>
  );
}
