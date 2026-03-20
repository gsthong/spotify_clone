import type { Metadata } from 'next'
import { AudioProvider } from '@/lib/audio-context'
import { NowPlayingProvider } from '@/lib/now-playing-context'
import { AppShellWrapper } from '@/components/app-shell-wrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe',
  description: 'Personal music player',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AudioProvider>
          <NowPlayingProvider>
            <AppShellWrapper>
              {children}
            </AppShellWrapper>
          </NowPlayingProvider>
        </AudioProvider>
      </body>
    </html>
  )
}