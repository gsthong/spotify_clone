'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

export function VibeToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ 
        message: e.detail.message || e.detail, 
        type: e.detail.type || 'success' 
      });
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener('vibe-toast', handleToast);
    return () => window.removeEventListener('vibe-toast', handleToast);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-white text-black shadow-2xl flex items-center gap-3 min-w-[200px]"
        >
          {toast.type === 'success' && <CheckCircle size={18} className="text-green-600" />}
          {toast.type === 'info' && <Info size={18} className="text-blue-600" />}
          {toast.type === 'error' && <AlertCircle size={18} className="text-red-600" />}
          <span className="text-sm font-bold whitespace-nowrap">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
