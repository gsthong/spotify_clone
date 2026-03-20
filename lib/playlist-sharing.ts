import { db } from './db';
import { Track } from './types';

export async function exportPlaylist(playlistId: number): Promise<string | null> {
  const playlist = await db.playlists.get(playlistId);
  if (!playlist) return null;

  const tracks = await db.tracks.where('id').anyOf(playlist.trackIds).toArray();
  
  const data = {
    type: 'vibe-playlist',
    version: 1,
    name: playlist.name,
    tracks: tracks.map(t => ({
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      albumArt: t.albumArt,
      ytId: t.id // Assuming id is ytId for now
    }))
  };

  return JSON.stringify(data);
}

export async function importPlaylist(jsonString: string): Promise<{ name: string; count: number } | null> {
  try {
    const data = JSON.parse(jsonString);
    if (data.type !== 'vibe-playlist') return null;

    const tracks: Track[] = data.tracks.map((t: any) => ({
      id: t.ytId,
      title: t.title,
      artist: t.artist,
      album: '',
      albumArt: t.albumArt,
      duration: t.duration,
      url: t.ytId,
      plays: 0,
      mood: 'chill'
    }));

    await db.tracks.bulkPut(tracks);
    const id = await db.playlists.add({
      name: data.name + ' (Imported)',
      createdAt: Date.now(),
      trackIds: tracks.map(t => t.id)
    });

    return { name: data.name, count: tracks.length };
  } catch {
    return null;
  }
}
