'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/audio-context';
import { Howl } from 'howler';
import { CloudRain, Coffee, Flame, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const AMBIENT_SOUNDS = [
  { id: 'rain', label: 'Rain', icon: CloudRain, url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c369dd4470.mp3' }, // Placeholder URLs
  { id: 'cafe', label: 'Cafe', icon: Coffee, url: 'https://cdn.pixabay.com/audio/2021/11/25/audio_2e7e31e138.mp3' },
  { id: 'fire', label: 'Fireplace', icon: Flame, url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_6a3ba61e5f.mp3' },
];

export function AmbientMixer() {
  const { state, setAmbientVolume } = useAudio();
  const howlsRef = useRef<Record<string, Howl>>({});

  useEffect(() => {
    AMBIENT_SOUNDS.forEach(sound => {
      if (!howlsRef.current[sound.id]) {
        howlsRef.current[sound.id] = new Howl({
          src: [sound.url],
          loop: true,
          volume: state.ambientVolumes[sound.id] || 0,
          autoplay: (state.ambientVolumes[sound.id] || 0) > 0,
          html5: true,
        });
      }
    });

    return () => {
      Object.values(howlsRef.current).forEach(h => h.stop());
    };
  }, []);

  const handleVolumeChange = (id: string, value: number) => {
    const vol = value / 100;
    setAmbientVolume(id, vol);
    const howl = howlsRef.current[id];
    if (howl) {
      howl.volume(vol);
      if (vol > 0 && !howl.playing()) howl.play();
      else if (vol === 0 && howl.playing()) howl.pause();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Volume2 size={18} className="text-white/40" />
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Ambient Mixer</h3>
      </div>
      
      {AMBIENT_SOUNDS.map(sound => (
        <div key={sound.id} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
            <sound.icon size={20} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-white">{sound.label}</span>
              <span className="text-xs text-white/20">{Math.round((state.ambientVolumes[sound.id] || 0) * 100)}%</span>
            </div>
            <Slider
              value={[(state.ambientVolumes[sound.id] || 0) * 100]}
              max={100}
              step={1}
              onValueChange={([val]) => handleVolumeChange(sound.id, val)}
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
