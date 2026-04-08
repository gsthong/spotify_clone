export type Mood = 'suy' | 'hype' | 'overdose' | 'chill' | null;

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  albumArt: string;
  mood?: Mood;
  plays: number;
  lyrics?: string;
}

export interface PlaylistItem {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date;
}

export type PlayerMode = 'default' | 'vinyl' | 'cassette' | 'terminal' | 'zen' | 'focus' | 'concert' | 'night-drive';
export type SpatialPreset = 'off' | 'concert' | 'headphones' | 'room' | 'stadium';
export type ThemeName = 'midnight' | 'amoled' | 'pastel' | 'crt' | 'neon';

export interface AudioState {
  currentTrack: Track | null;
  queue: Track[];
  currentQueueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  accentColor: string;
  radioMode?: boolean;
  shuffleMood?: Mood;
  playerMode: PlayerMode;
  spatialPreset: SpatialPreset;
  theme: ThemeName;
  ambientVolumes: Record<string, number>;
  streak: number;
  kinetic?: {
    bpm: number;
    energy: number;
    isBeat: boolean;
    confidence: number;
  };
}

export interface ColorPalette {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
}
