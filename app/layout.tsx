import type { Metadata } from 'next'
import { AudioProvider } from '@/lib/audio-context'
import { AppShellWrapper } from '@/components/app-shell-wrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { DynamicBackground } from '@/components/dynamic-background'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vibe',
  description: 'Personal music player',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AudioProvider>
             <AppShellWrapper>
               {children}
             </AppShellWrapper>
             <DynamicBackground />
             <Toaster />
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}