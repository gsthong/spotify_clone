import { useState, useMemo } from 'react';
import { Track } from '@/lib/types';

export type SortKey = 'title' | 'artist' | 'album' | 'addedAt' | 'plays' | 'duration';
export type SortOrder = 'asc' | 'desc';

export function useSort(initialTracks: Track[]) {
  const [sortKey, setSortKey] = useState<SortKey>('addedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedTracks = useMemo(() => {
    return [...initialTracks].sort((a: any, b: any) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      // Handle nulls/undefined
      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [initialTracks, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return { sortedTracks, sortKey, sortOrder, toggleSort, setSortKey, setSortOrder };
}
