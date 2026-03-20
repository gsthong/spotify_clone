'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio-context';
import { Play, X, GripVertical } from 'lucide-react';
import { Track } from '@/lib/types';

function SortableTrackItem({ 
  track, 
  index, 
  isCurrent, 
  onPlay, 
  onRemove 
}: { 
  track: Track; 
  index: number; 
  isCurrent: boolean;
  onPlay: (t: Track) => void;
  onRemove: (i: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `${track.id}-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 px-4 py-2 rounded-md group tap-highlight-none ${isDragging ? 'bg-white/10' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/60 transition-colors"
      >
        <GripVertical size={16} />
      </div>

      <img 
        src={track.albumArt} 
        alt="" 
        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} 
      />

      <div className="flex-1 min-w-0" onClick={() => onPlay(track)}>
        <p style={{ 
          fontSize: '15px', 
          fontWeight: 500, 
          color: isCurrent ? 'var(--sp-green)' : 'white', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {track.title}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artist}
        </p>
      </div>

      <p className="hidden sm:block" style={{ fontSize: '13px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>
        {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
      </p>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100" style={{ transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(track); }}
          className="p-1 rounded text-white"
        >
          <Play size={14} fill="white" strokeWidth={0} />
        </button>
        {!isCurrent && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="p-1 rounded text-white/40 hover:text-white"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { state, play, removeFromQueue, reorderQueue } = useAudio();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = state.queue.findIndex((_, i) => `${state.queue[i].id}-${i}` === active.id);
      const newIndex = state.queue.findIndex((_, i) => `${state.queue[i].id}-${i}` === over?.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  const currentTrack = state.currentTrack;
  const queueItems = state.queue;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--sp-bg)', padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginBottom: '32px' }}>Queue</h1>

      {currentTrack && (
        <div className="mb-10">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Now playing
          </p>
          <div className="flex items-center gap-4 px-4 py-3 rounded-md bg-white/5 border border-white/5">
            <img src={currentTrack.albumArt} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--sp-green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack.title}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--sp-text-secondary)' }}>{currentTrack.artist}</p>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--sp-text-secondary)', flexShrink: 0 }}>
              {Math.floor(currentTrack.duration / 60)}:{String(currentTrack.duration % 60).padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Next in queue
          </p>
          <p style={{ fontSize: '12px', color: 'var(--sp-text-secondary)' }}>
            {queueItems.length} tracks
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={queueItems.map((t, i) => `${t.id}-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {queueItems.map((track, idx) => (
                  <motion.div
                    key={`${track.id}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SortableTrackItem
                      track={track}
                      index={idx}
                      isCurrent={track.id === currentTrack?.id && idx === state.currentQueueIndex}
                      onPlay={play}
                      onRemove={removeFromQueue}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {queueItems.length === 0 && !currentTrack && (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <p>Your queue is empty</p>
        </div>
      )}
    </div>
  );
}
