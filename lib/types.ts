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
}

export interface ColorPalette {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
}
