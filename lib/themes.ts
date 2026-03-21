export interface Theme {
  '--sp-bg': string;
  '--sp-bg-elevated': string;
  '--sp-green': string;
  '--sp-text-primary': string;
  '--sp-text-secondary': string;
  'shadow'?: string;
  'glow'?: string;
}

export const THEMES: Record<string, Theme> = {
  midnight: {
    '--sp-bg': '#121212',
    '--sp-bg-elevated': '#1a1a1a',
    '--sp-green': '#1db954',
    '--sp-text-primary': '#ffffff',
    '--sp-text-secondary': '#b3b3b3',
  },
  amoled: {
    '--sp-bg': '#000000',
    '--sp-bg-elevated': '#0a0a0a',
    '--sp-green': '#1db954',
    '--sp-text-primary': '#ffffff',
    '--sp-text-secondary': '#888888',
  },
  pastel: {
    '--sp-bg': '#1a1520',
    '--sp-bg-elevated': '#231d2e',
    '--sp-green': '#c084fc',
    '--sp-text-primary': '#f0e6ff',
    '--sp-text-secondary': '#a89fb5',
  },
  crt: {
    '--sp-bg': '#0a0f0a',
    '--sp-bg-elevated': '#0f160f',
    '--sp-green': '#00ff41',
    '--sp-text-primary': '#00ff41',
    '--sp-text-secondary': 'rgba(0,255,65,0.6)',
  },
  neon: {
    '--sp-bg': '#080010',
    '--sp-bg-elevated': '#0f0020',
    '--sp-green': '#ff2d78',
    '--sp-text-primary': '#ffffff',
    '--sp-text-secondary': 'rgba(255,45,120,0.6)',
    'glow': '0 0 10px #ff2d78',
  }
};

export function applyTheme(themeName: string) {
  const theme = THEMES[themeName] || THEMES.midnight;
  Object.entries(theme).forEach(([key, value]) => {
    if (key.startsWith('--')) {
      document.documentElement.style.setProperty(key, value);
    }
  });
  
  // Custom properties for specific effects
  if (theme.glow) {
    document.documentElement.style.setProperty('--accent-glow', theme.glow);
  } else {
    document.documentElement.style.removeProperty('--accent-glow');
  }

  // CRT Scanline effect
  if (themeName === 'crt') {
    document.documentElement.classList.add('crt-mode');
  } else {
    document.documentElement.classList.remove('crt-mode');
  }
}
