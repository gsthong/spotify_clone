'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/lib/audio-context';
import { db } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import { MOCK_TRACKS } from '@/lib/mock-data';
import { Track } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';

// ── ANSI-style color tokens ─────────────────────────────────
const C = {
  reset: '',
  green: 'text-[#00ff41]',
  dimGreen: 'text-[#00ff41]/60',
  cyan: 'text-[#00e5ff]',
  yellow: 'text-[#ffd600]',
  red: 'text-[#ff1744]',
  magenta: 'text-[#e040fb]',
  white: 'text-white',
  dim: 'text-white/40',
  orange: 'text-[#ff9100]',
  blue: 'text-[#448aff]',
};

interface Line {
  text: string;
  color?: string;
  indent?: number;
  isAscii?: boolean;
  isBar?: boolean;
  raw?: boolean; // for HTML-like rendering
}

const ASCII_BOOT = [
  '╔══════════════════════════════════════════════════════════╗',
  '║                                                        ║',
  '║   ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ███████╗   ║',
  '║   ██║   ██║██║██╔══██╗██╔════╝    ██╔═══██╗██╔════╝   ║',
  '║   ██║   ██║██║██████╔╝█████╗      ██║   ██║███████╗   ║',
  '║   ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║   ██║╚════██║   ║',
  '║    ╚████╔╝ ██║██████╔╝███████╗    ╚██████╔╝███████║   ║',
  '║     ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚══════╝   ║',
  '║                                                        ║',
  '║           Terminal Interface v2.0.0 · kinetic           ║',
  '╚══════════════════════════════════════════════════════════╝',
];

function makeBar(value: number, max: number, width: number = 30, filled = '█', empty = '░'): string {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const filledCount = Math.round(pct * width);
  return filled.repeat(filledCount) + empty.repeat(width - filledCount);
}

function makeSparkline(data: number[], width: number = 40): string {
  const chars = '▁▂▃▄▅▆▇█';
  if (data.length === 0) return chars[0].repeat(width);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return data.slice(-width).map(v => {
    const idx = Math.round(((v - min) / range) * (chars.length - 1));
    return chars[Math.min(idx, chars.length - 1)];
  }).join('');
}

export default function VibeTerminal() {
  const {
    state, togglePlay, nextTrack, previousTrack, play, setQueue, seek,
    setVolume, toggleMute, smartShuffle, toggleRadio, setAccentColor,
    setPlayerMode, setSpatialPreset, setTheme, analyserRef, audioRef,
  } = useAudio();

  const [input, setInput] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBooting, setIsBooting] = useState(true);
  const [cursorBlink, setCursorBlink] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const energyHistoryRef = useRef<number[]>([]);

  // Track energy over time for sparklines
  useEffect(() => {
    if (state.kinetic?.energy !== undefined) {
      energyHistoryRef.current.push(state.kinetic.energy);
      if (energyHistoryRef.current.length > 60) energyHistoryRef.current.shift();
    }
  }, [state.kinetic?.energy]);

  // Boot sequence
  useEffect(() => {
    const bootLines: Line[] = [];
    ASCII_BOOT.forEach(l => bootLines.push({ text: l, color: C.green, isAscii: true }));
    bootLines.push({ text: '', color: C.dim });
    bootLines.push({ text: `[boot] Initializing audio subsystem...`, color: C.dimGreen });
    bootLines.push({ text: `[boot] Dexie DB connected · VibeDB`, color: C.dimGreen });
    bootLines.push({ text: `[boot] Kinetic engine online · BPM detector armed`, color: C.dimGreen });
    bootLines.push({ text: `[boot] Proxy endpoint: ${PROXY_URL}`, color: C.dimGreen });
    bootLines.push({ text: `[boot] Ready. Type 'help' for commands.`, color: C.green });
    bootLines.push({ text: '', color: C.dim });

    setLines(bootLines);
    setTimeout(() => setIsBooting(false), 600);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorBlink(p => !p), 530);
    return () => clearInterval(id);
  }, []);

  // ── All available commands ──────────────────────────────────
  const COMMANDS: Record<string, string> = {
    help: 'Show all commands',
    play: 'Toggle play/pause or play track by index',
    pause: 'Pause playback',
    next: 'Next track',
    prev: 'Previous track',
    now: 'Show now-playing details',
    queue: 'List current queue',
    seek: 'Seek to position (e.g. seek 1:30)',
    vol: 'Set volume 0-100 (e.g. vol 80)',
    mute: 'Toggle mute',
    shuffle: 'Shuffle the queue',
    radio: 'Toggle radio mode',
    search: 'Search YouTube (e.g. search lofi beats)',
    add: 'Add track to queue by search index',
    db: 'Database operations (db stats, db tracks, db history, db clear-history)',
    kinetic: 'Show real-time audio analysis data',
    graph: 'Show audio processing graph',
    sys: 'System info & diagnostics',
    theme: 'Set theme (midnight/amoled/pastel/crt/neon)',
    spatial: 'Set spatial preset (off/headphones/room/concert/stadium)',
    mode: 'Set player mode (default/vinyl/cassette/terminal/zen)',
    accent: 'Set accent color (e.g. accent #ff6b6b)',
    export: 'Export queue/history as JSON',
    alias: 'Create command alias (e.g. alias np=now)',
    eval: 'Evaluate JS expression against audio state',
    clear: 'Clear terminal',
    neofetch: 'Show system summary with ASCII art',
    ascii: 'Show ASCII art for current track',
    bars: 'Show live frequency bars snapshot',
    spectrum: 'Show frequency spectrum snapshot',
    streak: 'Show listening streak info',
    uptime: 'Show session uptime',
  };

  const aliasesRef = useRef<Record<string, string>>({
    np: 'now',
    q: 'queue',
    s: 'search',
    n: 'next',
    p: 'prev',
    v: 'vol',
    k: 'kinetic',
    '?': 'help',
    ff: 'seek +30',
    rw: 'seek -10',
  });

  const sessionStartRef = useRef(Date.now());
  const lastSearchRef = useRef<Track[]>([]);

  const pushLines = useCallback((newLines: Line[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const pushLine = useCallback((text: string, color?: string, indent?: number) => {
    setLines(prev => [...prev, { text, color, indent }]);
  }, []);

  // ── Command execution engine ────────────────────────────────
  const executeCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Check aliases
    const firstWord = trimmed.split(' ')[0];
    const resolved = aliasesRef.current[firstWord]
      ? trimmed.replace(firstWord, aliasesRef.current[firstWord])
      : trimmed;

    const parts = resolved.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    pushLine(`❯ ${raw}`, C.white);

    switch (cmd) {
      // ── HELP ────────────────────────────────────────────────
      case 'help': {
        pushLine('', C.dim);
        pushLine('┌─ VIBE OS · Command Reference ──────────────────────┐', C.cyan);
        const entries = Object.entries(COMMANDS);
        const categories: Record<string, string[]> = {
          'PLAYBACK': ['play', 'pause', 'next', 'prev', 'seek', 'vol', 'mute', 'shuffle', 'radio'],
          'DISCOVERY': ['search', 'add', 'queue', 'now'],
          'ENGINE': ['kinetic', 'graph', 'bars', 'spectrum', 'ascii'],
          'DATABASE': ['db', 'export', 'streak'],
          'CONFIG': ['theme', 'spatial', 'mode', 'accent', 'alias'],
          'SYSTEM': ['sys', 'neofetch', 'uptime', 'eval', 'clear', 'help'],
        };

        for (const [cat, cmds] of Object.entries(categories)) {
          pushLine(`│`, C.cyan);
          pushLine(`│  ── ${cat} ${'─'.repeat(40 - cat.length)}`, C.yellow);
          for (const c of cmds) {
            const desc = COMMANDS[c] || '';
            pushLine(`│    ${c.padEnd(14)} ${desc}`, C.green);
          }
        }
        pushLine('│', C.cyan);
        pushLine('│  Aliases: ' + Object.entries(aliasesRef.current).map(([k, v]) => `${k}→${v}`).join(', '), C.dim);
        pushLine('└────────────────────────────────────────────────────┘', C.cyan);
        pushLine('', C.dim);
        break;
      }

      // ── PLAY ────────────────────────────────────────────────
      case 'play': {
        if (args.length > 0) {
          const idx = parseInt(args[0]);
          if (!isNaN(idx) && state.queue[idx]) {
            play(state.queue[idx]);
            pushLine(`▶ Playing [${idx}] ${state.queue[idx].title} — ${state.queue[idx].artist}`, C.green);
          } else {
            pushLine(`✗ Invalid queue index: ${args[0]}`, C.red);
          }
        } else {
          togglePlay();
          pushLine(state.isPlaying ? '⏸ Paused' : '▶ Resuming playback...', C.green);
        }
        break;
      }

      case 'pause': {
        if (state.isPlaying) {
          togglePlay();
          pushLine('⏸ Paused', C.yellow);
        } else {
          pushLine('Already paused.', C.dim);
        }
        break;
      }

      case 'next': {
        nextTrack();
        pushLine('⏭ Skipping to next track...', C.green);
        break;
      }

      case 'prev': {
        previousTrack();
        pushLine('⏮ Going to previous track...', C.green);
        break;
      }

      // ── NOW ─────────────────────────────────────────────────
      case 'now': {
        const t = state.currentTrack;
        if (!t) {
          pushLine('Nothing playing.', C.dim);
          break;
        }
        const pct = t.duration > 0 ? state.currentTime / t.duration : 0;
        const bar = makeBar(state.currentTime, t.duration, 40);
        const bpm = state.kinetic?.bpm ?? '—';
        const energy = state.kinetic?.energy ?? 0;
        const conf = state.kinetic?.confidence ?? 0;

        pushLines([
          { text: '', color: C.dim },
          { text: '┌─ NOW PLAYING ──────────────────────────────────────┐', color: C.magenta },
          { text: `│  Title:    ${t.title}`, color: C.white },
          { text: `│  Artist:   ${t.artist}`, color: C.dim },
          { text: `│  Album:    ${t.album || '—'}`, color: C.dim },
          { text: `│  ID:       ${t.id}`, color: C.dim },
          { text: `│  Mood:     ${t.mood || 'untagged'}`, color: C.cyan },
          { text: '│', color: C.magenta },
          { text: `│  ${formatTime(state.currentTime)} ${bar} ${formatTime(t.duration)}`, color: C.green },
          { text: `│  ${' '.repeat(6)}${'─'.repeat(Math.round(pct * 40))}◆${'─'.repeat(40 - Math.round(pct * 40))}`, color: C.green },
          { text: '│', color: C.magenta },
          { text: `│  ♫ BPM: ${bpm}   ⚡ Energy: ${(energy * 100).toFixed(0)}%   📊 Confidence: ${(conf * 100).toFixed(0)}%`, color: C.cyan },
          { text: `│  🔊 Volume: ${Math.round(state.volume * 100)}%   ${state.isMuted ? '🔇 MUTED' : ''}   ${state.radioMode ? '📻 RADIO ON' : ''}`, color: C.yellow },
          { text: `│  ⚙ Mode: ${state.playerMode}   🎧 Spatial: ${state.spatialPreset}   🎨 Theme: ${state.theme}`, color: C.dim },
          { text: '└────────────────────────────────────────────────────┘', color: C.magenta },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── QUEUE ───────────────────────────────────────────────
      case 'queue': {
        if (state.queue.length === 0) {
          pushLine('Queue is empty. Use "search" to find tracks.', C.dim);
          break;
        }
        pushLine('', C.dim);
        pushLine(`┌─ QUEUE (${state.queue.length} tracks) ─────────────────────────────┐`, C.cyan);
        state.queue.forEach((t, i) => {
          const isCurrent = i === state.currentQueueIndex;
          const prefix = isCurrent ? '▶' : ' ';
          const idx = `[${String(i).padStart(2)}]`;
          const dur = formatTime(t.duration);
          const title = t.title.length > 30 ? t.title.slice(0, 27) + '...' : t.title;
          pushLine(
            `│  ${prefix} ${idx} ${title.padEnd(32)} ${t.artist.slice(0, 18).padEnd(18)} ${dur}`,
            isCurrent ? C.green : C.dim
          );
        });
        pushLine('└────────────────────────────────────────────────────┘', C.cyan);
        pushLine('', C.dim);
        break;
      }

      // ── SEEK ────────────────────────────────────────────────
      case 'seek': {
        if (args.length === 0) {
          pushLine('Usage: seek <time> (e.g. seek 1:30, seek +30, seek -10)', C.yellow);
          break;
        }
        const arg = args[0];
        let targetTime: number;

        if (arg.startsWith('+')) {
          targetTime = state.currentTime + parseInt(arg.slice(1));
        } else if (arg.startsWith('-')) {
          targetTime = state.currentTime - parseInt(arg.slice(1));
        } else if (arg.includes(':')) {
          const [m, s] = arg.split(':').map(Number);
          targetTime = m * 60 + s;
        } else {
          targetTime = parseInt(arg);
        }

        if (isNaN(targetTime)) {
          pushLine(`✗ Invalid time: ${arg}`, C.red);
        } else {
          seek(Math.max(0, Math.min(targetTime, state.currentTrack?.duration ?? 0)));
          pushLine(`⏩ Seeked to ${formatTime(targetTime)}`, C.green);
        }
        break;
      }

      // ── VOLUME ──────────────────────────────────────────────
      case 'vol': {
        if (args.length === 0) {
          const bar = makeBar(state.volume, 1, 20);
          pushLine(`🔊 Volume: ${Math.round(state.volume * 100)}% ${bar}`, C.green);
        } else {
          const v = parseInt(args[0]);
          if (isNaN(v) || v < 0 || v > 100) {
            pushLine('Usage: vol <0-100>', C.yellow);
          } else {
            setVolume(v / 100);
            pushLine(`🔊 Volume set to ${v}% ${makeBar(v, 100, 20)}`, C.green);
          }
        }
        break;
      }

      case 'mute': {
        toggleMute();
        pushLine(state.isMuted ? '🔊 Unmuted' : '🔇 Muted', C.yellow);
        break;
      }

      case 'shuffle': {
        await smartShuffle(null);
        pushLine('🔀 Queue shuffled!', C.green);
        break;
      }

      case 'radio': {
        toggleRadio();
        pushLine(state.radioMode ? '📻 Radio mode OFF' : '📻 Radio mode ON — will auto-add related tracks', C.cyan);
        break;
      }

      // ── SEARCH ──────────────────────────────────────────────
      case 'search': {
        if (args.length === 0) {
          pushLine('Usage: search <query>', C.yellow);
          break;
        }
        const query = args.join(' ');
        pushLine(`🔍 Searching for "${query}"...`, C.dim);

        try {
          const res = await fetch(`${PROXY_URL}/search?q=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          const tracks: Track[] = data.map((r: any) => ({
            id: r.id,
            title: r.title,
            artist: r.artist || r.channel || 'Unknown',
            album: '',
            duration: r.duration || 0,
            url: r.id,
            albumArt: r.thumbnail || '',
            plays: 0,
            mood: null,
          }));

          lastSearchRef.current = tracks;

          if (tracks.length === 0) {
            pushLine('No results found.', C.dim);
          } else {
            pushLine('', C.dim);
            pushLine(`┌─ SEARCH RESULTS (${tracks.length}) ───────────────────────────┐`, C.cyan);
            tracks.forEach((t, i) => {
              const title = t.title.length > 40 ? t.title.slice(0, 37) + '...' : t.title;
              const dur = t.duration > 0 ? formatTime(t.duration) : '—:——';
              pushLine(`│  [${String(i).padStart(2)}] ${title.padEnd(42)} ${dur}`, C.green);
            });
            pushLine('└────────────────────────────────────────────────────┘', C.cyan);
            pushLine('Use "add <index>" to queue, or "add <index> --play" to play immediately.', C.dim);
            pushLine('', C.dim);
          }
        } catch (err: any) {
          pushLine(`✗ Search failed: ${err.message}`, C.red);
          pushLine('  Make sure the proxy server is running.', C.dim);
        }
        break;
      }

      // ── ADD ─────────────────────────────────────────────────
      case 'add': {
        if (args.length === 0) {
          pushLine('Usage: add <search_index> [--play]', C.yellow);
          break;
        }
        const idx = parseInt(args[0]);
        const shouldPlay = args.includes('--play') || args.includes('-p');
        const track = lastSearchRef.current[idx];

        if (!track) {
          pushLine(`✗ No search result at index ${idx}. Run "search" first.`, C.red);
        } else {
          if (shouldPlay) {
            setQueue([...state.queue, track], state.queue.length);
            play(track);
            pushLine(`▶ Now playing: ${track.title}`, C.green);
          } else {
            setQueue([...state.queue, track]);
            pushLine(`✓ Added to queue: ${track.title}`, C.green);
          }
        }
        break;
      }

      // ── DB ──────────────────────────────────────────────────
      case 'db': {
        const subCmd = args[0] || 'stats';

        if (subCmd === 'stats') {
          const trackCount = await db.tracks.count();
          const historyCount = await db.history.count();
          const playlistCount = await db.playlists.count();
          const cacheCount = await db.cache.count();

          pushLines([
            { text: '', color: C.dim },
            { text: '┌─ DATABASE STATS ───────────────────────────────────┐', color: C.cyan },
            { text: `│  Engine:       Dexie v4 (IndexedDB)`, color: C.dim },
            { text: `│  Database:     VibeDB`, color: C.dim },
            { text: `│  ─────────────────────────────────`, color: C.dim },
            { text: `│  tracks:       ${String(trackCount).padStart(6)} records`, color: C.green },
            { text: `│  history:      ${String(historyCount).padStart(6)} records`, color: C.green },
            { text: `│  playlists:    ${String(playlistCount).padStart(6)} records`, color: C.green },
            { text: `│  cache:        ${String(cacheCount).padStart(6)} entries`, color: C.green },
            { text: '└────────────────────────────────────────────────────┘', color: C.cyan },
            { text: '', color: C.dim },
          ]);
        } else if (subCmd === 'tracks') {
          const tracks = await db.tracks.toArray();
          if (tracks.length === 0) {
            pushLine('No tracks in database.', C.dim);
          } else {
            pushLine(`┌─ DB TRACKS (${tracks.length}) ─────────────────────────────────┐`, C.cyan);
            tracks.slice(0, 20).forEach((t: any, i: number) => {
              pushLine(`│  [${String(i).padStart(2)}] ${(t.title || 'Untitled').slice(0, 35).padEnd(35)} plays:${String(t.plays || 0).padStart(4)}`, C.green);
            });
            if (tracks.length > 20) pushLine(`│  ... and ${tracks.length - 20} more`, C.dim);
            pushLine('└────────────────────────────────────────────────────┘', C.cyan);
          }
        } else if (subCmd === 'history') {
          const history = await db.history.orderBy('playedAt').reverse().limit(15).toArray();
          if (history.length === 0) {
            pushLine('No listening history.', C.dim);
          } else {
            pushLine('┌─ RECENT HISTORY ───────────────────────────────────┐', C.cyan);
            for (const h of history) {
              const date = new Date(h.playedAt).toLocaleString();
              const trackData = await db.tracks.get(h.trackId);
              const name = trackData?.title || h.trackId;
              pushLine(`│  ${date.padEnd(22)} ${name.slice(0, 30)}`, C.dim);
            }
            pushLine('└────────────────────────────────────────────────────┘', C.cyan);
          }
        } else if (subCmd === 'clear-history') {
          await db.history.clear();
          pushLine('✓ History cleared.', C.green);
        } else {
          pushLine(`Unknown db command: ${subCmd}. Try: stats, tracks, history, clear-history`, C.yellow);
        }
        break;
      }

      // ── KINETIC ─────────────────────────────────────────────
      case 'kinetic': {
        const k = state.kinetic;
        if (!k) {
          pushLine('Kinetic engine not initialized. Play a track first.', C.dim);
          break;
        }
        const energyBar = makeBar(k.energy, 1, 30);
        const confBar = makeBar(k.confidence, 1, 20);
        const sparkline = makeSparkline(energyHistoryRef.current, 50);

        pushLines([
          { text: '', color: C.dim },
          { text: '┌─ KINETIC ENGINE · Real-Time Audio Analysis ────────┐', color: C.magenta },
          { text: `│  BPM:         ${String(k.bpm).padStart(3)} ${k.isBeat ? '██ BEAT ██' : '          '}`, color: k.isBeat ? C.green : C.cyan },
          { text: `│  Energy:      ${(k.energy * 100).toFixed(1).padStart(5)}% ${energyBar}`, color: C.green },
          { text: `│  Confidence:  ${(k.confidence * 100).toFixed(1).padStart(5)}% ${confBar}`, color: C.yellow },
          { text: `│  Beat Pulse:  ${k.isBeat ? '⚡ ACTIVE' : '○ waiting'}`, color: k.isBeat ? C.green : C.dim },
          { text: '│', color: C.magenta },
          { text: `│  Energy History (last 50 frames):`, color: C.dim },
          { text: `│  ${sparkline}`, color: C.green },
          { text: '│', color: C.magenta },
          { text: `│  Beat Interval: ~${k.bpm > 0 ? (60000 / k.bpm).toFixed(0) : '—'}ms`, color: C.dim },
          { text: `│  Sample Rate:  ${typeof window !== 'undefined' ? '44100' : '—'} Hz`, color: C.dim },
          { text: '└────────────────────────────────────────────────────┘', color: C.magenta },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── GRAPH ───────────────────────────────────────────────
      case 'graph': {
        pushLines([
          { text: '', color: C.dim },
          { text: '┌─ AUDIO PROCESSING GRAPH ──────────────────────────────────────────┐', color: C.cyan },
          { text: '│                                                                    │', color: C.cyan },
          { text: '│  ┌───────────┐    ┌────────┐    ┌──────┐    ┌──────────┐          │', color: C.white },
          { text: '│  │ <audio>   │───▶│ Panner │───▶│ Gain │───▶│ Analyser │──▶ 🔊    │', color: C.green },
          { text: '│  │ element   │    │ (HRTF) │    │ node │    │ (FFT)    │          │', color: C.dim },
          { text: '│  └───────────┘    └────────┘    └──────┘    └──────────┘          │', color: C.white },
          { text: '│        │                                                           │', color: C.dim },
          { text: '│        │          ┌──────────────┐    ┌──────────────────┐         │', color: C.white },
          { text: '│        └─────────▶│ BiquadFilter │───▶│ Kinetic Engine  │         │', color: C.magenta },
          { text: '│                   │ (LP: 150Hz)  │    │ (BPM Detection) │         │', color: C.dim },
          { text: '│                   └──────────────┘    └──────────────────┘         │', color: C.white },
          { text: '│                                                                    │', color: C.cyan },
          { text: '│  State:                                                            │', color: C.dim },
          { text: `│    Spatial:  ${state.spatialPreset.padEnd(12)} Volume: ${Math.round(state.volume * 100)}%${state.isMuted ? ' (MUTED)' : ''}`, color: C.yellow },
          { text: `│    Playing:  ${state.isPlaying ? 'YES' : 'NO'}${' '.repeat(10)} BPM: ${state.kinetic?.bpm ?? '—'}`, color: C.yellow },
          { text: '└──────────────────────────────────────────────────────────────────┘', color: C.cyan },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── BARS ────────────────────────────────────────────────
      case 'bars': {
        const analyser = analyserRef?.current;
        if (!analyser || !state.isPlaying) {
          pushLine('No audio data. Play a track first.', C.dim);
          break;
        }

        const bufferLength = analyser.frequencyBinCount;
        const data = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(data);

        const numBars = 50;
        const step = Math.floor(bufferLength / numBars);
        const heights: number[] = [];
        for (let i = 0; i < numBars; i++) {
          heights.push(data[i * step] / 255);
        }

        const maxHeight = 12;
        pushLine('┌─ FREQUENCY BARS ─────────────────────────────────────────┐', C.cyan);
        for (let row = maxHeight; row >= 0; row--) {
          let line = '│  ';
          for (let col = 0; col < numBars; col++) {
            const barHeight = Math.round(heights[col] * maxHeight);
            if (barHeight >= row) {
              line += row > maxHeight * 0.7 ? '█' : row > maxHeight * 0.4 ? '▓' : '░';
            } else {
              line += ' ';
            }
          }
          pushLine(line, row > maxHeight * 0.7 ? C.red : row > maxHeight * 0.4 ? C.yellow : C.green);
        }
        pushLine('│  ' + '─'.repeat(numBars), C.dim);
        pushLine('│  0Hz' + ' '.repeat(numBars - 14) + `${analyser.context.sampleRate / 2}Hz`, C.dim);
        pushLine('└──────────────────────────────────────────────────────────┘', C.cyan);
        break;
      }

      // ── SPECTRUM ────────────────────────────────────────────
      case 'spectrum': {
        const analyser = analyserRef?.current;
        if (!analyser || !state.isPlaying) {
          pushLine('No audio data. Play a track first.', C.dim);
          break;
        }

        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        // Create sparkline from frequency data
        const buckets = 60;
        const step = Math.floor(data.length / buckets);
        const values: number[] = [];
        for (let i = 0; i < buckets; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j];
          values.push(sum / step);
        }

        pushLine('┌─ SPECTRUM ─────────────────────────────────────────────────────┐', C.cyan);
        pushLine(`│  ${makeSparkline(values, 60)}`, C.green);
        pushLine(`│  ${'▔'.repeat(60)}`, C.dim);
        pushLine(`│  Sub    Bass    Mid     High    Presence  Brilliance`, C.dim);
        pushLine('└───────────────────────────────────────────────────────────────┘', C.cyan);
        break;
      }

      // ── SYS ─────────────────────────────────────────────────
      case 'sys': {
        const mem = (performance as any).memory;
        const uptime = Math.floor((Date.now() - sessionStartRef.current) / 1000);

        pushLines([
          { text: '', color: C.dim },
          { text: '┌─ SYSTEM DIAGNOSTICS ──────────────────────────────┐', color: C.cyan },
          { text: `│  Platform:    ${navigator.platform}`, color: C.dim },
          { text: `│  User Agent:  ${navigator.userAgent.slice(0, 50)}...`, color: C.dim },
          { text: `│  Cores:       ${navigator.hardwareConcurrency || '—'}`, color: C.dim },
          { text: `│  Language:    ${navigator.language}`, color: C.dim },
          { text: `│  Session:     ${formatTime(uptime)}`, color: C.green },
          { text: `│  Proxy:       ${PROXY_URL}`, color: C.dim },
          ...(mem ? [
            { text: `│  JS Heap:     ${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB / ${(mem.totalJSHeapSize / 1048576).toFixed(1)}MB`, color: C.yellow },
          ] : []),
          { text: `│  Queue Size:  ${state.queue.length} tracks`, color: C.green },
          { text: `│  Streak:      ${state.streak} days`, color: C.green },
          { text: '└────────────────────────────────────────────────────┘', color: C.cyan },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── NEOFETCH ────────────────────────────────────────────
      case 'neofetch': {
        const trackCount = await db.tracks.count();
        const historyCount = await db.history.count();
        const uptime = Math.floor((Date.now() - sessionStartRef.current) / 1000);

        const left = [
          '       ▄▄▄▄▄▄▄▄▄▄▄       ',
          '    ▄█████████████████▄    ',
          '  ██████▀▀▀▀▀▀▀▀██████▄   ',
          ' ███▀▀   ▄▄▄▄▄▄   ▀▀███  ',
          ' ██   ▄██▀▀▀▀▀▀██▄   ██  ',
          '██  ▄██▀  ░░░░  ▀██▄  ██ ',
          '██ ███   ░░▓▓░░   ███ ██ ',
          '██  ▀██▄  ░░░░  ▄██▀  ██ ',
          ' ██   ▀██▄▄▄▄▄▄██▀   ██  ',
          ' ███▄▄   ▀▀▀▀▀▀   ▄▄███  ',
          '  ▀██████▄▄▄▄▄▄██████▀   ',
          '    ▀█████████████████▀    ',
          '       ▀▀▀▀▀▀▀▀▀▀▀       ',
        ];

        const right = [
          `user@vibe-os`,
          `──────────────`,
          `OS: Vibe OS v2.0.0`,
          `Shell: vibe-sh`,
          `Engine: Web Audio API`,
          `Kinetic: BPM=${state.kinetic?.bpm ?? '—'}`,
          `DB: VibeDB (${trackCount} tracks)`,
          `History: ${historyCount} plays`,
          `Uptime: ${formatTime(uptime)}`,
          `Queue: ${state.queue.length} tracks`,
          `Theme: ${state.theme}`,
          `Spatial: ${state.spatialPreset}`,
          `Volume: ${Math.round(state.volume * 100)}%`,
        ];

        pushLine('', C.dim);
        for (let i = 0; i < Math.max(left.length, right.length); i++) {
          const l = (left[i] || '').padEnd(28);
          const r = right[i] || '';
          pushLine(`  ${l} ${r}`, i < left.length ? C.cyan : C.dim);
        }
        pushLine('', C.dim);
        // Color blocks
        pushLine('  ' + ' '.repeat(28) + ' ███████████████████████████', C.dim);
        pushLine('', C.dim);
        break;
      }

      // ── THEME / SPATIAL / MODE ──────────────────────────────
      case 'theme': {
        if (args.length === 0) {
          pushLine(`Current theme: ${state.theme}`, C.cyan);
          pushLine('Options: midnight, amoled, pastel, crt, neon', C.dim);
        } else {
          setTheme(args[0] as any);
          pushLine(`🎨 Theme set to: ${args[0]}`, C.green);
        }
        break;
      }

      case 'spatial': {
        if (args.length === 0) {
          pushLine(`Current spatial preset: ${state.spatialPreset}`, C.cyan);
          pushLine('Options: off, headphones, room, concert, stadium', C.dim);
        } else {
          setSpatialPreset(args[0] as any);
          pushLine(`🎧 Spatial preset set to: ${args[0]}`, C.green);
        }
        break;
      }

      case 'mode': {
        if (args.length === 0) {
          pushLine(`Current mode: ${state.playerMode}`, C.cyan);
          pushLine('Options: default, vinyl, cassette, terminal, zen, focus, concert, night-drive', C.dim);
        } else {
          setPlayerMode(args[0] as any);
          pushLine(`⚙ Player mode set to: ${args[0]}`, C.green);
        }
        break;
      }

      case 'accent': {
        if (args.length === 0) {
          pushLine(`Current accent: ${state.accentColor}`, C.cyan);
          pushLine('Usage: accent #ff6b6b', C.dim);
        } else {
          setAccentColor(args[0]);
          pushLine(`🎨 Accent color set to: ${args[0]}`, C.green);
        }
        break;
      }

      // ── ALIAS ───────────────────────────────────────────────
      case 'alias': {
        if (args.length === 0) {
          pushLine('Current aliases:', C.cyan);
          Object.entries(aliasesRef.current).forEach(([k, v]) => {
            pushLine(`  ${k} → ${v}`, C.green);
          });
          pushLine('Usage: alias <name>=<command>', C.dim);
        } else {
          const aliasStr = args.join(' ');
          const [name, ...rest] = aliasStr.split('=');
          if (name && rest.length) {
            aliasesRef.current[name.trim()] = rest.join('=').trim();
            pushLine(`✓ Alias set: ${name.trim()} → ${rest.join('=').trim()}`, C.green);
          } else {
            pushLine('Usage: alias <name>=<command>', C.yellow);
          }
        }
        break;
      }

      // ── EXPORT ──────────────────────────────────────────────
      case 'export': {
        const what = args[0] || 'queue';
        let data: any;

        if (what === 'queue') {
          data = state.queue.map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration }));
        } else if (what === 'history') {
          data = await db.history.toArray();
        } else {
          pushLine('Usage: export queue|history', C.yellow);
          break;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-${what}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        pushLine(`✓ Exported ${what} (${data.length} items) to file.`, C.green);
        break;
      }

      // ── EVAL ────────────────────────────────────────────────
      case 'eval': {
        if (args.length === 0) {
          pushLine('Usage: eval <expression> (context: state, db)', C.yellow);
          break;
        }
        try {
          const expr = args.join(' ');
          // Safe-ish eval with audio state as context
          const fn = new Function('state', 'queue', 'track', `return (${expr})`);
          const result = fn(state, state.queue, state.currentTrack);
          pushLine(`→ ${JSON.stringify(result, null, 2)}`, C.cyan);
        } catch (err: any) {
          pushLine(`✗ ${err.message}`, C.red);
        }
        break;
      }

      // ── ASCII ───────────────────────────────────────────────
      case 'ascii': {
        const t = state.currentTrack;
        if (!t) {
          pushLine('Nothing playing.', C.dim);
          break;
        }
        const isPlaying = state.isPlaying;
        pushLines([
          { text: '', color: C.dim },
          { text: isPlaying ? '  ╔══════════════╗' : '  ╔══════════════╗', color: C.magenta },
          { text: isPlaying ? '  ║  ♫  ▶  ♫  ♫ ║' : '  ║  ♫  ⏸  ♫  ♫ ║', color: C.green },
          { text: '  ║              ║', color: C.magenta },
          { text: '  ║  ┌────────┐  ║', color: C.magenta },
          { text: '  ║  │ ◉    ◉ │  ║', color: C.cyan },
          { text: '  ║  │   ──   │  ║', color: C.cyan },
          { text: '  ║  │        │  ║', color: C.cyan },
          { text: '  ║  └────────┘  ║', color: C.magenta },
          { text: '  ║              ║', color: C.magenta },
          { text: '  ╚══════════════╝', color: C.magenta },
          { text: `  ${t.title}`, color: C.white },
          { text: `  ${t.artist}`, color: C.dim },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── STREAK ──────────────────────────────────────────────
      case 'streak': {
        const streak = state.streak || parseInt(localStorage.getItem('vibe-streak') || '0');
        const flames = '🔥'.repeat(Math.min(streak, 10));
        pushLines([
          { text: '', color: C.dim },
          { text: `  Listening Streak: ${streak} day${streak !== 1 ? 's' : ''} ${flames}`, color: C.orange },
          { text: `  Last active: ${localStorage.getItem('vibe-last-streak-date') || 'today'}`, color: C.dim },
          { text: '', color: C.dim },
        ]);
        break;
      }

      // ── UPTIME ──────────────────────────────────────────────
      case 'uptime': {
        const uptime = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        pushLine(`⏱ Session uptime: ${formatTime(uptime)}`, C.green);
        break;
      }

      // ── CLEAR ───────────────────────────────────────────────
      case 'clear': {
        setLines([]);
        break;
      }

      // ── UNKNOWN ─────────────────────────────────────────────
      default: {
        pushLine(`Command not found: ${cmd}`, C.red);
        // Fuzzy suggest
        const allCmds = [...Object.keys(COMMANDS), ...Object.keys(aliasesRef.current)];
        const close = allCmds.filter(c => c.startsWith(cmd.slice(0, 2)));
        if (close.length > 0) {
          pushLine(`  Did you mean: ${close.join(', ')}?`, C.dim);
        }
        break;
      }
    }

    pushLine('', C.dim);
  }, [state, pushLine, pushLines, togglePlay, nextTrack, previousTrack, play, setQueue, seek,
      setVolume, toggleMute, smartShuffle, toggleRadio, setAccentColor, setPlayerMode,
      setSpatialPreset, setTheme, analyserRef]);

  // ── Submit handler ──────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setCmdHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    executeCommand(input);
    setInput('');
    setSuggestions([]);
  };

  // ── Key handler (history navigation + tab complete) ─────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = historyIndex < cmdHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIdx);
      setInput(cmdHistory[cmdHistory.length - 1 - newIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIdx);
      setInput(newIdx >= 0 ? cmdHistory[cmdHistory.length - 1 - newIdx] || '' : '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const allCmds = [...Object.keys(COMMANDS), ...Object.keys(aliasesRef.current)];
      const matches = allCmds.filter(c => c.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
        setSuggestions([]);
      } else if (matches.length > 1) {
        setSuggestions(matches);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: '#0a0a0a',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace",
        fontSize: '13px',
        lineHeight: '1.6',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle CRT glow */}
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          boxShadow: 'inset 0 0 120px rgba(0,255,65,0.05)',
        }}
      />

      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style={{
          borderColor: 'rgba(0,255,65,0.15)',
          backgroundColor: 'rgba(0,255,65,0.03)',
        }}
      >
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[#00ff41]/60 text-xs ml-2">
          vibe@terminal — {state.isPlaying ? `▶ ${state.currentTrack?.title || 'Unknown'}` : '⏸ idle'}
          {state.kinetic?.bpm ? ` · ${state.kinetic.bpm} BPM` : ''}
        </span>
        <span className="ml-auto text-[#00ff41]/30 text-xs">
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pb-0 scroll-hide"
      >
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={i > lines.length - 5 ? { opacity: 0, x: -4 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.08 }}
              className={`whitespace-pre-wrap ${line.color || C.dim}`}
              style={{
                paddingLeft: line.indent ? `${line.indent * 16}px` : undefined,
                fontFamily: line.isAscii ? "'JetBrains Mono', monospace" : undefined,
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Tab-complete suggestions */}
        {suggestions.length > 1 && (
          <div className={`${C.dim} mt-1`}>
            {suggestions.join('  ')}
          </div>
        )}
      </div>

      {/* Input line */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
        style={{
          borderColor: 'rgba(0,255,65,0.1)',
          backgroundColor: 'rgba(0,255,65,0.02)',
        }}
      >
        <span className="text-[#00ff41] font-bold shrink-0 select-none">
          {state.isPlaying ? '▶' : '○'} vibe:~$
        </span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="bg-transparent border-none outline-none flex-1 text-white caret-[#00ff41]"
          style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
        />
        <span
          className={`w-2 h-4 ${cursorBlink ? 'bg-[#00ff41]' : 'bg-transparent'}`}
          style={{ transition: 'background-color 0.05s' }}
        />
      </form>
    </div>
  );
}
