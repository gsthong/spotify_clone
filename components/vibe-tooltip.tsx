'use client';

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface VibeTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function VibeTooltip({ children, content, side = 'top' }: VibeTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={400}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            className="z-[100] px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 rounded-md shadow-xl border border-white/10 animate-in fade-in zoom-in duration-200"
            sideOffset={8}
          >
            {content}
            <Tooltip.Arrow className="fill-zinc-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
