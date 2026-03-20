// ═══════════════════════════════════════════════════════════════
// Vibe — Railway Proxy Server
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

// ─── GET /related?id=VIDEO_ID&limit=5 ──────────────────────────
app.get('/related', async (req, res) => {
  const { id, limit = 5 } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid YouTube ID' });
  }

  try {
    const raw = await runYtDlp(
      `--flat-playlist --dump-json "https://youtube.com/watch?v=${id}" --playlist-end ${parseInt(limit) + 1}`,
      25000
    );

    const lines = raw.split('\n').filter(line => line.startsWith('{'));
    // Filter out the original video itself if it appears in the results
    const results = lines.map(line => {
      try {
        const item = JSON.parse(line);
        const vidId = item.id || item.url?.split('v=')[1]?.split('&')[0] || '';
        if (vidId === id) return null;
        return {
          id: vidId,
          title: item.title || 'Unknown',
          artist: item.uploader || item.channel || 'Unknown Artist',
          thumbnail: item.thumbnail || (vidId ? `https://i.ytimg.com/vi/${vidId}/mqdefault.jpg` : ''),
          duration: item.duration || 0,
        };
      } catch { return null; }
    }).filter(Boolean).slice(0, limit);

    return res.json(results);
  } catch (err) {
    console.error('[related] error:', err.message);
    return res.status(503).json({ error: 'Related tracks unavailable', detail: err.message });
  }
});

// ─── Spotify OAuth & Import (Feature 10) ───────────────────────
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${req => req.protocol + '://' + req.get('host')}/spotify/callback`; // Dynamic redirect

app.get('/spotify/auth', (req, res) => {
  const scope = 'playlist-read-private playlist-read-collaborative';
  const state = Math.random().toString(36).substring(7);
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(req.query.redirect || 'http://localhost:3000/settings')}&state=${state}`;
  res.redirect(authUrl);
});

app.get('/spotify/callback', async (req, res) => {
  const { code, state } = req.query;
  // In a real app, we'd exchange code for token here and redirect back with token
  // For simplicity in this proxy, we'll just redirect to the frontend with the code
  // The frontend can then call our /spotify/token endpoint
  res.redirect(`${req.query.state || 'http://localhost:3000/settings'}?spotify_code=${code}`);
});

app.get('/spotify/token', async (req, res) => {
  const { code, redirect_uri } = req.query;
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/spotify/playlists', async (req, res) => {
  const { token } = req.query;
  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const playlists = data.items.map(p => ({
      id: p.id,
      name: p.name,
      trackCount: p.tracks.total,
      imageUrl: p.images?.[0]?.url || ''
    }));
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/spotify/playlist', async (req, res) => {
  const { token, id } = req.query;
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const tracks = data.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists[0].name,
      duration: Math.floor(item.track.duration_ms / 1000),
      imageUrl: item.track.album.images?.[0]?.url || ''
    }));
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lyrics endpoint (proxy to LRCLIB)
app.get('/lyrics', async (req, res) => {
  const { artist, title, duration } = req.query;
  if (!artist || !title) {
    return res.status(400).json({ error: 'artist and title are required' });
  }

  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}${duration ? `&duration=${duration}` : ''}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Vibe/1.0 (https://github.com/gsthong/spotify_clone)' }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch lyrics' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`[proxy] Server running on port ${PORT}`);
});
