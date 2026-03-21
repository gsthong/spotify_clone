'use client';

import { AppShell } from './app-shell';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <AppShell>{children}</AppShell>;
}