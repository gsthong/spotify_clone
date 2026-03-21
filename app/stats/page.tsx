'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { db } from '@/lib/db';
import { useWeeklyStats } from '@/hooks/use-weekly-stats';
import { useDiscoveryScore } from '@/hooks/use-discovery-score';
import { ListeningHeatmap } from '@/components/listening-heatmap';
import { MoodTimelineChart } from '@/components/mood-timeline-chart';
import { ListeningPatternChart } from '@/components/listening-pattern-chart';
import { WeeklyWrapModal } from '@/components/weekly-wrap-modal';
import { Flame, Compass, Calendar, BarChart3, ArrowRight, Music, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StatsPage() {
  const router = useRouter();
  const { state, play, setQueue } = useAudio();
  const { stats: weeklyStats, isLoading: weeklyLoading } = useWeeklyStats();
  const { score: discoveryScore, label: discoveryLabel } = useDiscoveryScore();
  const [showWeeklyWrap, setShowWeeklyWrap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<{ date: Date; count: number }[]>([]);
  const [moodTimeline, setMoodTimeline] = useState<{
    labels: string[];
    suy: number[];
    hype: number[];
    overdose: number[];
    chill: number[];
  }>({ labels: [], suy: [], hype: [], overdose: [], chill: [] });
  const [patternData, setPatternData] = useState<number[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const logs = await db.history.toArray();
      
      // Heatmap
      const dateCounts: Record<string, number> = {};
      logs.forEach(l => {
        const d = new Date(l.playedAt).toISOString().split('T')[0];
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      });
      setHeatmapData(Object.entries(dateCounts).map(([d, c]) => ({ date: new Date(d), count: c })));

      // Mood Timeline (Last 8 weeks)
      const weekLabels: string[] = [];
      const moodSets: { suy: number[]; hype: number[]; overdose: number[]; chill: number[] } = { suy: [], hype: [], overdose: [], chill: [] };
      for (let i = 7; i >= 0; i--) {
        const end = Date.now() - (i * 7 * 24 * 60 * 60 * 1000);
        const start = end - (7 * 24 * 60 * 60 * 1000);
        const weekLogs = logs.filter(l => l.playedAt >= start && l.playedAt < end);
        const label = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        weekLabels.push(label);
        
        const trackIds = Array.from(new Set(weekLogs.map(l => l.trackId)));
        const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();
        const tMap = new Map(tracks.map(t => [t.id, t]));
        
        const counts = { suy: 0, hype: 0, overdose: 0, chill: 0 };
        weekLogs.forEach(l => {
          const m = tMap.get(l.trackId)?.mood;
          if (m && m in counts) counts[m as keyof typeof counts]++;
        });
        const total = weekLogs.length || 1;
        moodSets.suy.push((counts.suy / total) * 100);
        moodSets.hype.push((counts.hype / total) * 100);
        moodSets.overdose.push((counts.overdose / total) * 100);
        moodSets.chill.push((counts.chill / total) * 100);
      }
      setMoodTimeline({ labels: weekLabels, ...moodSets });

      // Pattern (Time slots)
      const slots = new Array(6).fill(0);
      logs.forEach(l => {
        const hour = new Date(l.playedAt).getHours();
        if (hour >= 6 && hour < 12) slots[0]++;
        else if (hour >= 12 && hour < 17) slots[1]++;
        else if (hour >= 17 && hour < 21) slots[2]++;
        else if (hour >= 21) slots[3]++; // Night 21-24
        else if (hour >= 0 && hour < 3) slots[4]++;
        else if (hour >= 3 && hour < 6) slots[5]++;
      });
      const maxSlot = Math.max(...slots) || 1;
      setPatternData(slots.map(s => (s / maxSlot) * 100));
    };
    fetchStats();
  }, []);

  return (
    <div className="h-full overflow-y-auto px-6 py-8 custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">My Stats</h1>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Last 365 Days
          </p>
        </div>
        <button 
          onClick={() => router.push('/wrapped')}
          className="bg-[var(--sp-green)] text-black px-6 py-2 rounded-full font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          View Yearly Wrapped
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Streak */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="text-orange-500" size={24} />
            <h3 className="text-white/40 text-xs font-black uppercase tracking-widest">Listening Streak</h3>
          </div>
          <p className="text-5xl font-black text-white mb-1">{state.streak} <span className="text-lg font-bold text-white/40">days</span></p>
          <p className="text-white/30 text-xs italic">Personal best: 24 days</p>
        </div>

        {/* Discovery Score */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 col-span-1 md:col-span-2 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Compass className="text-blue-400" size={24} />
              <h3 className="text-white/40 text-xs font-black uppercase tracking-widest">Discovery Score</h3>
            </div>
            <p className="text-2xl font-black text-white mb-2">{discoveryLabel}</p>
            <p className="text-white/40 text-xs">Based on {discoveryScore}% new discoveries this week.</p>
          </div>
          <div className="w-24 h-24 relative">
             <svg className="w-full h-full" viewBox="0 0 36 36">
               <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
               <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: discoveryScore / 100 }}
                className="text-[var(--sp-green)]" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100, 100" 
               />
               <text x="18" y="21" className="text-[8px] font-black fill-white text-center" textAnchor="middle">{discoveryScore}</text>
             </svg>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-12">
        <h2 className="text-white/40 text-xs font-black uppercase tracking-widest mb-6">Activity Heatmap</h2>
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
          <ListeningHeatmap data={heatmapData} />
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={14} /> Mood Over Time
          </h2>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 h-[300px]">
             <MoodTimelineChart data={moodTimeline} />
          </div>
        </div>
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-widest mb-6 px-1">Listening Patterns</h2>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 h-[300px]">
             <ListeningPatternChart data={patternData} />
          </div>
        </div>
      </div>

      {/* Weekly Wrap Card */}
      {weeklyStats && (
        <div 
          onClick={() => setShowWeeklyWrap(true)}
          className="bg-gradient-to-br from-[#1a0a2e] to-[#0d1b2a] p-8 rounded-[40px] border border-white/10 mb-12 cursor-pointer hover:scale-[1.02] transition-all group overflow-hidden relative"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-4">Monday Wrap</p>
              <h2 className="text-4xl font-black text-white mb-2">Your week in Vibe</h2>
              <p className="text-white/60">Tap to see your top songs and stats.</p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-[var(--sp-green)] group-hover:text-black transition-colors">
              <Play fill="currentColor" size={24} />
            </div>
          </div>
          <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
            <Music size={200} />
          </div>
        </div>
      )}

      {showWeeklyWrap && weeklyStats && (
        <WeeklyWrapModal stats={weeklyStats} onClose={() => setShowWeeklyWrap(false)} />
      )}
    </div>
  );
}
