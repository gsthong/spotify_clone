import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

export function useDiscoveryScore() {
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState('In Your Comfort Zone');

  useEffect(() => {
    const calculateScore = async () => {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const thisWeekLogs = await db.history
        .where('playedAt')
        .above(sevenDaysAgo)
        .toArray();
      
      if (thisWeekLogs.length === 0) return;

      const thisWeekIds = new Set(thisWeekLogs.map(l => l.trackId));
      
      const previousLogs = await db.history
        .where('playedAt')
        .below(sevenDaysAgo)
        .toArray();
      
      const previousIds = new Set(previousLogs.map(l => l.trackId));
      
      const newTracksCount = Array.from(thisWeekIds).filter(id => !previousIds.has(id)).length;
      const totalTracksCount = thisWeekIds.size;

      const rawScore = Math.round((newTracksCount / totalTracksCount) * 100) || 0;
      setScore(rawScore);

      if (rawScore <= 20) setLabel('In Your Comfort Zone 🛋');
      else if (rawScore <= 40) setLabel('Familiar Grounds 🗺');
      else if (rawScore <= 60) setLabel('Curious Explorer 🧭');
      else if (rawScore <= 80) setLabel('Adventurer 🌍');
      else setLabel('True Discoverer 🚀');
    };

    calculateScore();
  }, []);

  return { score, label };
}
