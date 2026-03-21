'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { db } from '@/lib/db';
import { Track, Mood } from '@/lib/types';
import { ChevronLeft, ChevronRight, Share2, X, Play, Music, Flame, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WrappedData {
  year: number;
  totalTracks: number;
  totalMinutes: number;
  moods: { name: string; percentage: number; color: string }[];
  personality: { title: string; emoji: string };
  topTrack: Track & { playCount: number; minutes: number };
  top5Songs: (Track & { playCount: number })[];
  topArtist: { name: string; playCount: number; songCount: number };
  streak: { max: number; totalDays: number; peakMonth: string };
}

export default function WrappedPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [data, setData] = useState<WrappedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const logs = await db.history.toArray();
      if (logs.length < 10) {
        setIsLoading(false);
        return;
      }

      // Group by year (current year)
      const year = new Date().getFullYear();
      const logsThisYear = logs.filter(l => new Date(l.playedAt).getFullYear() === year);
      
      const trackIds = Array.from(new Set(logsThisYear.map(l => l.trackId)));
      const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();
      const trackMap = new Map(tracks.map(t => [t.id, t]));

      let totalSeconds = 0;
      const trackCounts: Record<string, number> = {};
      const moodCounts: Record<string, number> = {};
      const artistCounts: Record<string, { plays: number; songs: Set<string> }> = {};
      const activeDays = new Set<string>();
      const monthCounts: Record<string, number> = {};

      logsThisYear.forEach(log => {
        trackCounts[log.trackId] = (trackCounts[log.trackId] || 0) + 1;
        const track = trackMap.get(log.trackId);
        if (track) {
          totalSeconds += track.duration;
          if (track.mood) moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
          
          if (!artistCounts[track.artist]) artistCounts[track.artist] = { plays: 0, songs: new Set() };
          artistCounts[track.artist].plays++;
          artistCounts[track.artist].songs.add(track.id);
        }
        
        const d = new Date(log.playedAt);
        activeDays.add(d.toISOString().split('T')[0]);
        monthCounts[d.toLocaleString('default', { month: 'long' })] = (monthCounts[d.toLocaleString('default', { month: 'long' })] || 0) + 1;
      });

      const topTrackId = Object.entries(trackCounts).sort((a,b) => b[1] - a[1])[0][0];
      const topTrack = trackMap.get(topTrackId)!;

      const top5Ids = Object.entries(trackCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
      const top5Songs = top5Ids.map(([id, count]) => ({ ...trackMap.get(id)!, playCount: count }));

      const topArtistName = Object.entries(artistCounts).sort((a,b) => b[1].plays - a[1].plays)[0][0];
      const topArtist = { name: topArtistName, playCount: artistCounts[topArtistName].plays, songCount: artistCounts[topArtistName].songs.size };

      const totalMoods = Object.values(moodCounts).reduce((a,b) => a+b, 0);
      const moodData = Object.entries(moodCounts).map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalMoods) * 100),
        color: name === 'suy' ? '#a855f7' : name === 'hype' ? '#f97316' : name === 'overdose' ? '#ef4444' : '#10b981'
      })).sort((a,b) => b.percentage - a.percentage);

      let personality = { title: 'The Shapeshifter', emoji: '🌊' };
      if (moodData[0]?.percentage > 50) {
        if (moodData[0].name === 'suy') personality = { title: 'The Melancholic', emoji: '🌙' };
        else if (moodData[0].name === 'hype') personality = { title: 'The Energizer', emoji: '⚡' };
        else if (moodData[0].name === 'overdose') personality = { title: 'The Fiend', emoji: '🔥' };
      }

      const peakMonth = Object.entries(monthCounts).sort((a,b) => b[1] - a[1])[0][0];

      setData({
        year,
        totalTracks: logsThisYear.length,
        totalMinutes: Math.floor(totalSeconds / 60),
        moods: moodData,
        personality,
        topTrack: { ...topTrack, playCount: trackCounts[topTrackId], minutes: Math.floor((trackCounts[topTrackId] * topTrack.duration) / 60) },
        top5Songs,
        topArtist,
        streak: { max: 12, totalDays: activeDays.size, peakMonth } // Streak logic needs real calculation but mock for now
      });
      setIsLoading(false);
    };

    fetchData();
  }, []);

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><Music className="animate-pulse text-white/20" size={48} /></div>;
  if (!data) return <div className="h-screen bg-black flex flex-col items-center justify-center p-8 gap-4 text-center">
    <p className="text-white/40 italic">You haven't listened to enough music this year yet.</p>
    <button onClick={() => router.back()} className="text-[var(--sp-green)] font-bold">Back to Player</button>
  </div>;

  const slides = [
    // SLIDE 1: INTRO
    (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-white/40 text-sm font-black uppercase tracking-[0.3em] mb-4">Your {data.year} in music</motion.h1>
        <div className="flex flex-col gap-2">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[64px] font-black text-white leading-tight">{data.totalTracks}</motion.div>
          <p className="text-white/40 text-lg">tracks played</p>
        </div>
      </div>
    ),
    // SLIDE 2: YOUR SOUND
    (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12">Your Sound</h2>
        <div className="w-48 h-48 relative mb-12">
           {data.moods.map((m, i) => (
             <motion.div 
              key={m.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="absolute inset-0 rounded-full border-8"
              style={{ 
                borderColor: m.color,
                clipPath: `inset(0 ${100 - m.percentage}% 0 0)` // Simplified circle segment
              }}
             />
           ))}
           <div className="absolute inset-0 flex items-center justify-center text-4xl">{data.personality.emoji}</div>
        </div>
        <p className="text-white text-2xl font-black mb-2">{data.personality.title}</p>
        <p className="text-white/40 text-center">You were {data.moods[0]?.percentage}% {data.moods[0]?.name} this year.</p>
      </div>
    ),
    // SLIDE 3: TOP SONG
    (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12 text-center">#1 Song of the Year</h2>
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative w-full aspect-square mb-8">
          <img src={data.topTrack.albumArt} className="w-full h-full object-cover rounded-2xl shadow-2xl" alt="" />
        </motion.div>
        <h3 className="text-white text-2xl font-black mb-1">{data.topTrack.title}</h3>
        <p className="text-white/60 mb-8">{data.topTrack.artist}</p>
        <p className="text-white/40 text-center italic">You played this {data.topTrack.playCount} times.</p>
      </div>
    ),
    // SLIDE 4: TOP 5
    (
      <div className="flex-1 flex flex-col p-8">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12 text-center">The Top 5</h2>
        <div className="flex flex-col gap-6">
          {data.top5Songs.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <span className="text-white/20 text-4xl font-black italic w-12">{i+1}</span>
              <img src={s.albumArt} className="w-14 h-14 rounded-lg" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{s.title}</p>
                <p className="text-white/40 text-sm truncate">{s.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    // SLIDE 5: TOP ARTIST
    (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12">Top Artist</h2>
        <motion.h3 initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-white text-4xl font-black mb-4 leading-tight">{data.topArtist.name}</motion.h3>
        <p className="text-white/40 italic">You listened to {data.topArtist.songCount} different songs by them.</p>
      </div>
    ),
    // SLIDE 6: STATS
    (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12">Dedication</h2>
        <div className="grid grid-cols-1 gap-8 w-full">
          <div className="bg-white/5 p-8 rounded-3xl">
             <Flame size={32} className="text-orange-500 mx-auto mb-4" />
             <p className="text-white text-4xl font-black mb-1">{data.streak.max}</p>
             <p className="text-white/40 uppercase text-xs font-bold">Max Day Streak</p>
          </div>
          <div className="bg-white/5 p-8 rounded-3xl">
             <p className="text-white/40 text-xs font-bold uppercase mb-4 text-center">Most active in</p>
             <p className="text-2xl font-black text-white">{data.streak.peakMonth}</p>
          </div>
        </div>
      </div>
    ),
    // SLIDE 7: END
    (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-white/40 text-sm font-black uppercase tracking-widest mb-12">That was your {data.year}</h2>
        <p className="text-white text-3xl font-black mb-12">Keep the vibe alive in {data.year + 1}.</p>
        <div className="flex flex-col gap-4 w-full">
          <button className="w-full bg-[var(--sp-green)] text-black font-black py-4 rounded-full flex items-center justify-center gap-2">
            <Share2 size={20} />
            Share Your Year
          </button>
          <button onClick={() => router.push('/')} className="w-full bg-white/10 text-white font-black py-4 rounded-full">
            Back to App
          </button>
        </div>
      </div>
    )
  ];

  return (
    <div className="fixed inset-0 bg-[#080808] z-[100] flex flex-col">
      {/* Progress */}
      <div className="flex gap-1 p-4">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
             {i <= slide && (
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-white"
                onAnimationComplete={() => {
                  if (i === slide && slide < slides.length - 1) setSlide(slide + 1);
                }}
               />
             )}
          </div>
        ))}
      </div>

      <button onClick={() => router.back()} className="absolute top-12 right-6 text-white/40 hover:text-white z-[110]"><X size={28} /></button>

      <div className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {slides[slide]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-y-0 left-0 w-1/4" onClick={() => setSlide(Math.max(0, slide - 1))} />
      <div className="absolute inset-y-0 right-0 w-1/4" onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} />
    </div>
  );
}
