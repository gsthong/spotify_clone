'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ListMusic, TrendingUp } from 'lucide-react';

const NAVIGATION_ITEMS = [
  { icon: Home, label: 'HOME', href: '/' },
  { icon: Search, label: 'SEARCH', href: '/search' },
  { icon: ListMusic, label: 'QUEUE', href: '/queue' },
  { icon: TrendingUp, label: 'STATS', href: '/stats' },
];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav
      className="w-full border-t"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border-light)',
        height: '56px',
      }}
    >
      <div className="flex items-center justify-around h-full px-4">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center relative"
              >
                <Icon 
                  size={18} 
                  strokeWidth={1.5}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    transition: 'color 0.2s',
                  }}
                />
                <span 
                  className="font-mono text-xs mt-1 uppercase tracking-tight"
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    transition: 'color 0.2s',
                    fontSize: '9px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
