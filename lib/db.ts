import Dexie, { type EntityTable } from 'dexie';
import { Track } from './types';

interface CachedAsset {
  id: string;
  data: Blob | string;
  type: 'image' | 'lyrics' | 'artist_info';
  createdAt: number;
}

const db = new Dexie('VibeMusicDB') as Dexie & {
  tracks: EntityTable<Track & { cachedAt: number }, 'id'>;
  cache: EntityTable<CachedAsset, 'id'>;
  history: EntityTable<{ id?: number; trackId: string; playedAt: number }, 'id'>;
  prefs: EntityTable<{ key: string; value: any }, 'key'>;
};

// Schema versioning
db.version(1).stores({
  tracks: 'id, mood, cachedAt',
  cache: 'id, type, createdAt',
  history: '++id, trackId, playedAt',
  prefs: 'key'
});

export { db };
