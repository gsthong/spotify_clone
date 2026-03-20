'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { Track, Mood } from '@/lib/types';
import { CheckCircle2, Tags, Trash2, X } from 'lucide-react';

interface BatchTagEditorProps {
  selectedIds: string[];
  onClose: () => void;
  onComplete: () => void;
}

export function BatchTagEditor({ selectedIds, onClose, onComplete }: BatchTagEditorProps) {
  const [mood, setMood] = useState<Mood>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApply = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (mood) {
        await db.tracks.where('id').anyOf(selectedIds).modify({ mood });
      }
      
      window.dispatchEvent(new CustomEvent('vibe-toast', { 
        detail: { message: `Updated tags for ${selectedIds.length} tracks`, type: 'success' } 
      }));
      onComplete();
    } catch (err) {
      console.error('[batch] error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedIds.length} tracks from your library?`)) return;
    setIsProcessing(true);
    
    try {
      await db.tracks.bulkDelete(selectedIds);
      window.dispatchEvent(new CustomEvent('vibe-toast', { 
        detail: { message: `Removed ${selectedIds.length} tracks`, type: 'success' } 
      }));
      onComplete();
    } catch (err) {
      console.error('[batch] error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#282828] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-6 min-w-[400px]"
    >
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <CheckCircle2 size={18} className="text-[#1db954]" />
        <span className="text-sm font-bold text-white">{selectedIds.length} selected</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Tags size={16} className="text-white/40" />
          <select 
            value={mood || ''} 
            onChange={e => setMood(e.target.value as Mood)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-white/20"
          >
            <option value="">Set Mood...</option>
            <option value="suy">SUY</option>
            <option value="hype">Hype</option>
            <option value="overdose">Overdose</option>
            <option value="chill">Chill</option>
          </select>
        </div>

        <button
          onClick={handleApply}
          disabled={isProcessing || !mood}
          className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full hover:scale-105 transition-transform disabled:opacity-50"
        >
          Apply
        </button>

        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="text-red-500 hover:text-red-400 p-2 transition-colors disabled:opacity-50"
          title="Delete selected"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <button onClick={onClose} className="ml-2 text-white/40 hover:text-white transition-colors">
        <X size={18} />
      </button>
    </motion.div>
  );
}
