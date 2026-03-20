import { db } from './db';

export async function exportLibrary(): Promise<string> {
  const tracks = await db.tracks.toArray();
  const playlists = await db.playlists.toArray();
  const history = await db.history.toArray();
  const prefs = await db.prefs.toArray();

  const data = {
    version: 1,
    exportDate: Date.now(),
    tracks,
    playlists,
    history,
    prefs
  };

  return JSON.stringify(data, null, 2);
}

export async function importLibrary(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error('Invalid backup format');
    }

    // Use a transaction for safety
    await db.transaction('rw', db.tracks, db.playlists, db.history, db.prefs, async () => {
      // We'll use clear() then putBulk() to fully restore state, 
      // or we could use 'put' to merge. To keep it clean for "Restore", we'll merge.
      if (data.tracks.length > 0) await db.tracks.bulkPut(data.tracks);
      if (data.playlists?.length > 0) await db.playlists.bulkPut(data.playlists);
      if (data.history?.length > 0) await db.history.bulkPut(data.history);
      if (data.prefs?.length > 0) await db.prefs.bulkPut(data.prefs);
    });

    return { success: true, count: data.tracks.length };
  } catch (err) {
    console.error('[backup] import error:', err);
    return { success: false, count: 0, error: (err as Error).message };
  }
}

export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
