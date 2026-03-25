# VIBE MUSIC — Setup Guide

## Prerequisites
- Node.js 18+
- A Railway account (railway.app) — free tier gives $5/month credit

---

## Step 1: Deploy the Railway Proxy

The `proxy/` folder contains a standalone Node.js server that wraps `yt-dlp` to resolve YouTube audio streams.

### 1a. Push to GitHub
Create a new repo and push the `proxy/` folder (or your whole repo — Railway only needs the folder).

### 1b. Create a Railway Project
1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Select your repo
3. In **Settings → Root Directory**, set it to `proxy` (if you pushed the whole monorepo)
4. Railway will auto-detect `package.json` and use `nixpacks.toml` to install `yt-dlp` and `ffmpeg`

### 1c. Set Environment Variables (optional)
Railway auto-sets `PORT`. No other variables needed for the proxy.

### 1d. Copy the Railway URL
After deploy, Railway shows a URL like:
```
https://vibe-music-proxy-production.up.railway.app
```

---

## Step 2: Configure the Frontend

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_PROXY_URL=https://your-railway-app.up.railway.app
```

---

## Step 3: Run the Frontend

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture Overview

```
Browser → Next.js Frontend (Vercel/local)
              ↓  fetch stream URL + search
          Railway Proxy (server.js)
              ↓  exec yt-dlp
          YouTube / YouTube Music
```

- **Stream resolution**: When you click a track with a YouTube ID, the frontend calls the Railway proxy's `/stream?id=...` endpoint. yt-dlp resolves the actual `.webm` audio URL and returns it.
- **Search**: `/search?q=...` calls `ytmsearch10:QUERY` via yt-dlp and returns structured JSON.
- **Cache**: Proxy caches stream URLs for 30 min (they expire after ~6h). Frontend caches for 25 min.
- **Fallback**: If the proxy is unavailable, tracks with an existing `url` field play normally. Tracks with empty `url` show a warning in the browser console.

---

## Proxy Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check: `{ status: 'ok' }` |
| `GET /stream?id=VIDEO_ID` | Returns `{ url, title, thumbnail, duration }` |
| `GET /search?q=QUERY` | Returns array of `{ id, title, artist, album, thumbnail, duration }` |

---

## Troubleshooting

**"Stream unavailable" error**
- yt-dlp may be rate-limited. Wait a few minutes and try again.
- Make sure `yt-dlp` and `ffmpeg` are installed (nixpacks.toml handles this on Railway).

**Search returns empty results**
- Some queries work better than others on YouTube Music. Try including the artist name.

**CORS errors in browser**
- The proxy allows all origins (`*`). If you see CORS errors, check your Railway URL in `.env.local`.

---

## Discord Rich Presence (Desktop)

Vibe supports Discord RPC via a local bridge.
1. Navigate to `discord-bridge/`
2. `npm install`
3. Update `clientId` in `discord-bridge.js` (Optional)
4. `node discord-bridge.js`
5. Keep the bridge running while using Vibe. Status will sync automatically.

---

## Android Home Screen Widget

Vibe supports minimal widgets via TWA (Trusted Web Activity).
1. Build your app as an APK using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
2. The widget point is `/widget`.
3. Configure your TWA manifest to use this URL for the widget provider.
