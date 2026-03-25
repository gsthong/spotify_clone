'use client';

import React, { useEffect } from 'react';
import { AppShell } from './app-shell';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useDiscordRpc } from '@/hooks/use-discord-rpc';
import { useLyricNotification } from '@/hooks/use-lyric-notification';

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  useDiscordRpc();
  useLyricNotification();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-lyrics.js').catch(console.error);
    }
  }, []);

  return <AppShell>{children}</AppShell>;
}