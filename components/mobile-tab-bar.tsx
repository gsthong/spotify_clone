'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, BarChart2, Settings } from 'lucide-react';

const TABS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Library', href: '/queue', icon: Library },
  { label: 'Stats', href: '/stats', icon: BarChart2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(18,18,18,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 40,
      }}
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href;
        const color = isActive ? 'white' : 'rgba(255,255,255,0.5)';
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color,
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon size={24} strokeWidth={1.5} color={color} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
