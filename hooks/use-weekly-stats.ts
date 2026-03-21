import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Track, Mood } from '@/lib/types';

export interface WeeklyStats {
  topTracks: { track: Track; count: number }[];
  totalMinutes: number;
  dominantMood: Mood;
  newThisWeek: number;
  daysActive: number;
}

export function useWeeklyStats() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeeklyStats = async () => {
    setIsLoading(true);
    try {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      
      const logs = await db.history
        .where('playedAt')
        .above(sevenDaysAgo)
        .toArray();

      if (logs.length === 0) {
        setStats(null);
        return;
      }

      const trackCounts: Record<string, number> = {};
      let totalSeconds = 0;
      const moodCounts: Record<string, number> = {};
      const activeDays = new Set<string>();

      const trackIds = Array.from(new Set(logs.map(l => l.trackId)));
      const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();
      const trackMap = new Map(tracks.map(t => [t.id, t]));

      logs.forEach(log => {
        trackCounts[log.trackId] = (trackCounts[log.trackId] || 0) + 1;
        
        const track = trackMap.get(log.trackId);
        if (track) {
          totalSeconds += track.duration;
          if (track.mood) {
            moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
          }
        }

        const date = new Date(log.playedAt).toISOString().split('T')[0];
        activeDays.add(date);
      });

      const topTrackEntries = Object.entries(trackCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      const topTracks = topTrackEntries.map(([id, count]) => ({
        track: trackMap.get(id)!,
        count
      })).filter(item => item.track);

      const dominantMood = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as Mood || null;

      // New tracks calculation (simplified: tracks not in history before 7 days ago)
      // This is a bit expensive to check every track, so we just check the ones from this week
      const previousLogs = await db.history
        .where('playedAt')
        .below(sevenDaysAgo)
        .toArray();
      const previousTrackIds = new Set(previousLogs.map(l => l.trackId));
      const newThisWeek = trackIds.filter(id => !previousTrackIds.has(id)).length;

      setStats({
        topTracks,
        totalMinutes: Math.floor(totalSeconds / 60),
        dominantMood,
        newThisWeek,
        daysActive: activeDays.size
      });
    } catch (err) {
      console.error('[stats] failed to fetch weekly stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  return { stats, isLoading, refetch: fetchWeeklyStats };
}
