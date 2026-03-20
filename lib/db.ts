import Dexie, { type EntityTable } from 'dexie';
import { Track } from './types';

interface CachedAsset {
  id: string;
  data: Blob | string;
  type: 'image' | 'lyrics' | 'artist_info';
  createdAt: number;
}

const db = new Dexie('VibeDB') as Dexie & {
  tracks: EntityTable<Track & { cachedAt?: number; plays?: number; addedAt?: number }, 'id'>;
  cache: EntityTable<CachedAsset, 'id'>;
  history: EntityTable<{ id?: number; trackId: string; playedAt: number; completed?: boolean; duration?: number; skipAt?: number }, 'id'>;
  playlists: EntityTable<{ id?: number; name: string; createdAt: number; trackIds: string[] }, 'id'>;
  tags: EntityTable<{ trackId: string; moods: string[] }, 'trackId'>;
  stats: EntityTable<{ id?: number; date: string; type: string; value: any }, 'id'>;
  duplicates: EntityTable<{ key: string; trackIds: string[] }, 'key'>;
  prefs: EntityTable<{ key: string; value: any }, 'key'>;
};

// Schema versioning
db.version(1).stores({
  tracks: 'id, mood, cachedAt',
  cache: 'id, type, createdAt',
  history: '++id, trackId, playedAt',
  prefs: 'key'
});

db.version(3).stores({
  tracks: 'id, mood, cachedAt, addedAt, plays',
  cache: 'id, type, createdAt',
  history: '++id, trackId, playedAt, completed',
  playlists: '++id, name, createdAt',
  tags: 'trackId, *moods',
  stats: '++id, date, type',
  duplicates: 'key',
  prefs: 'key'
});

export { db };
