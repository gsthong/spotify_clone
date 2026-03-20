import { db } from './db';
import { Track } from './types';

export interface SmartPlaylistRule {
  id: string;
  name: string;
  description: string;
  predicate: (tracks: any[]) => any[];
}

export const SMART_PLAYLISTS: SmartPlaylistRule[] = [
  {
    id: 'top-played',
    name: 'Top Played',
    description: 'Your most played tracks of all time',
    predicate: (tracks) => tracks
      .filter(t => (t.plays || 0) > 0)
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 50)
  },
  {
    id: 'recently-added',
    name: 'Recently Added',
    description: 'The latest additions to your library',
    predicate: (tracks) => tracks
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .slice(0, 50)
  },
  {
    id: 'chill-mix',
    name: 'Chill Mix',
    description: 'Relaxing tunes from your library',
    predicate: (tracks) => tracks
      .filter(t => t.mood === 'chill')
      .sort(() => Math.random() - 0.5)
  },
  {
    id: 'hype-mix',
    name: 'Hype Mix',
    description: 'Energy-packed tracks',
    predicate: (tracks) => tracks
      .filter(t => t.mood === 'hype')
      .sort(() => Math.random() - 0.5)
  },
  {
    id: 'forgotten-gems',
    name: 'Forgotten Gems',
    description: 'Tracks you haven\'t played in a while',
    predicate: (tracks) => tracks
      .filter(t => (t.plays || 0) > 0)
      .sort((a, b) => (a.lastPlayedAt || 0) - (b.lastPlayedAt || 0))
      .slice(0, 50)
  }
];

export async function getSmartPlaylistTracks(ruleId: string): Promise<Track[]> {
  const rule = SMART_PLAYLISTS.find(r => r.id === ruleId);
  if (!rule) return [];

  const allTracks = await db.tracks.toArray();
  return rule.predicate(allTracks);
}
