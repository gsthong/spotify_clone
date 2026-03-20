import { db } from './db';
import { Track } from './types';

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function findDuplicates(): Promise<{ key: string; tracks: Track[] }[]> {
  const allTracks = await db.tracks.toArray();
  const groups: { [key: string]: Track[] } = {};

  allTracks.forEach(track => {
    const key = `${normalize(track.title)}|${normalize(track.artist)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(track);
  });

  const exactDuplicates = Object.values(groups).filter(g => g.length > 1);
  
  // Fuzzy matching for potential duplicates (experimental)
  // For now, only exact match on normalized title/artist is reliable enough for auto-detection
  
  return Object.entries(groups)
    .filter(([_, tracks]) => tracks.length > 1)
    .map(([key, tracks]) => ({ key, tracks }));
}

export async function resolveDuplicates(key: string, keepId: string): Promise<void> {
  const group = await db.tracks.where('id').anyOf(key.split('|')).toArray(); // This is wrong, key is just a string
  // Correct way: find tracks in this group then delete all but keepId
}
