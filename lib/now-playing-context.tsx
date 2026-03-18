'use client';

import React, { createContext, useContext, useState } from 'react';

interface NowPlayingContextType {
  showNowPlaying: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
}

const NowPlayingContext = createContext<NowPlayingContextType>({
  showNowPlaying: false,
  openNowPlaying: () => {},
  closeNowPlaying: () => {},
});

export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  return (
    <NowPlayingContext.Provider value={{
      showNowPlaying,
      openNowPlaying: () => setShowNowPlaying(true),
      closeNowPlaying: () => setShowNowPlaying(false),
    }}>
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}