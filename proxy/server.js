// ═══════════════════════════════════════════════════════════════
// VIBE MUSIC — Railway Proxy Server
// Deploy to Railway:
//   1. Push this folder (proxy/) to a GitHub repo
//   2. New Railway project → Deploy from GitHub → select repo
//   3. Railway auto-detects Node.js via package.json
//   4. nixpacks.toml installs yt-dlp + ffmpeg in build phase
//   5. Set PORT env var in Railway (auto-set by Railway)
//   6. Copy the Railway URL → set NEXT_PUBLIC_PROXY_URL in frontend .env.local
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── In-memory stream URL cache (30 min TTL) ───────────────────
const streamCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCachedStream(youtubeId) {
  const entry = streamCache.get(youtubeId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    streamCache.delete(youtubeId);
    return null;
  }
  return entry;
}

function setCachedStream(youtubeId, data) {
  streamCache.set(youtubeId, {
    ...data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── Helper: run yt-dlp with timeout ───────────────────────────
async function runYtDlp(args, timeoutMs = 30000) {
  const { stdout } = await execAsync(`yt-dlp ${args}`, {
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

// ─── GET /health ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── GET /stream?id=YOUTUBE_ID ─────────────────────────────────
app.get('/stream', async (req, res) => {
  const { id } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid YouTube ID. Must be 11 characters.' });
  }

  const cached = getCachedStream(id);
  if (cached) {
    return res.json({ url: cached.url, title: cached.title, thumbnail: cached.thumbnail, duration: cached.duration, cached: true });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;

    // Get stream URL
    const streamUrl = await runYtDlp(
      `-f "bestaudio[ext=webm]/bestaudio/best" --get-url "${videoUrl}"`,
      30000
    );

    // Get metadata (title, thumbnail, duration)
    const metaRaw = await runYtDlp(
      `--dump-json --no-download "${videoUrl}"`,
      20000
    );
    const meta = JSON.parse(metaRaw);

    const data = {
      url: streamUrl.split('\n')[0],
      title: meta.title || 'Unknown Title',
      thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      duration: meta.duration || 0,
    };

    setCachedStream(id, data);
    return res.json(data);
  } catch (err) {
    console.error('[stream] yt-dlp error for id:', id, err.message);
    return res.status(503).json({ error: 'Stream unavailable', detail: err.message });
  }
});

// ─── GET /search?q=QUERY ───────────────────────────────────────
app.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Missing search query parameter "q".' });
  }

  const query = q.trim();
  try {
    const raw = await runYtDlp(
      `"ytmsearch10:${query}" --dump-json --flat-playlist --no-download`,
      25000
    );

    const lines = raw.split('\n').filter(line => line.startsWith('{'));
    const results = lines.map(line => {
      try {
        const item = JSON.parse(line);
        const id = item.id || item.url?.split('v=')[1]?.split('&')[0] || '';
        return {
          id,
          title: item.title || 'Unknown',
          artist: item.uploader || item.channel || 'Unknown Artist',
          album: item.album || '',
          thumbnail: item.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : ''),
          duration: item.duration || 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return res.json(results);
  } catch (err) {
    console.error('[search] yt-dlp error for query:', query, err.message);
    return res.status(503).json({ error: 'Search unavailable', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[vibe-proxy] Server running on port ${PORT}`);
});
