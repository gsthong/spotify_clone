'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Link, QrCode, Download, Copy, Check } from 'lucide-react';
import { Track } from '@/lib/types';
import { useShare } from '@/hooks/use-share';
import { useSync } from '@/hooks/use-sync';

interface ShareSheetProps {
  track: Track;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareSheet({ track, currentTime, isOpen, onClose }: ShareSheetProps) {
  const { shareTrack, generateShareCard } = useShare();
  const { copySyncLink, generateQRCode } = useSync();
  const [activeTab, setActiveTab] = useState<'options' | 'card' | 'qr'>('options');
  const [cardStyle, setCardStyle] = useState<'receipt' | 'polaroid' | 'minimal'>('receipt');
  const qrRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = () => {
    shareTrack(track, currentTime);
    onClose();
  };

  const handleCopyLink = () => {
    copySyncLink(track.id, currentTime);
    onClose();
  };

  const handleDownloadCard = () => {
    generateShareCard(track, 'share-card-content', cardStyle);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-[#181818] rounded-t-[24px] px-6 pt-2 pb-10 md:max-w-md md:mx-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2 mb-6" />

            {activeTab === 'options' && (
              <div className="flex flex-col gap-2">
                <h3 className="text-white font-bold text-center mb-6">Share this song</h3>
                
                <button onClick={handleShare} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Share2 size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">Social Share</p>
                    <p className="text-white/40 text-xs text-nowrap">Instagram, Facebook, etc.</p>
                  </div>
                </button>

                <button onClick={() => setActiveTab('card')} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">Vibe Share Card</p>
                    <p className="text-white/40 text-xs">Generate beautiful receipt or polaroid</p>
                  </div>
                </button>

                <button onClick={() => { setActiveTab('qr'); setTimeout(() => qrRef.current && generateQRCode(track.id, currentTime, qrRef.current), 50); }} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <QrCode size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">Cross-Platform Sync</p>
                    <p className="text-white/40 text-xs">QR Code for instant sync on another device</p>
                  </div>
                </button>

                <button onClick={handleCopyLink} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Link size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">Copy Deep Link</p>
                    <p className="text-white/40 text-xs">Link with timestamp for friends</p>
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'card' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <button onClick={() => setActiveTab('options')} className="text-white/40 text-sm font-bold">Back</button>
                  <h3 className="text-white font-bold">Share Card</h3>
                  <div className="w-8" />
                </div>

                {/* Card Preview Hidden from normal view but used for snapshot */}
                <div className="bg-[#121212] p-8 rounded-2xl flex flex-col items-center">
                   <div id="share-card-content" className={`w-full max-w-[300px] p-6 bg-[#181818] border border-white/5 flex flex-col items-center gap-4 ${cardStyle === 'receipt' ? 'receipt-style' : cardStyle === 'polaroid' ? 'polaroid-style' : ''}`}>
                      <img src={track.albumArt} alt="" className="w-48 h-48 rounded shadow-2xl object-cover" />
                      <div className="text-center w-full">
                        <p className="text-white font-black text-lg line-clamp-1">{track.title}</p>
                        <p className="text-white/50 font-bold text-sm uppercase tracking-wider">{track.artist}</p>
                      </div>
                      <div className="w-full h-px bg-white/10 my-2" />
                      <div className="flex justify-between w-full text-[10px] font-mono text-white/30 uppercase">
                        <span>VIBE MUSIC RECIEPT</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>

                <div className="flex justify-center gap-4">
                  {(['receipt', 'polaroid', 'minimal'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => setCardStyle(style)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${cardStyle === style ? 'bg-[var(--sp-green)] text-black' : 'bg-white/5 text-white/60'}`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>

                <button onClick={handleDownloadCard} className="w-full py-4 bg-white text-black rounded-full font-bold text-sm flex items-center justify-center gap-2">
                  <Download size={18} />
                  Download Card
                </button>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-between w-full">
                  <button onClick={() => setActiveTab('options')} className="text-white/40 text-sm font-bold">Back</button>
                  <h3 className="text-white font-bold">Scan to Sync</h3>
                  <div className="w-8" />
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-2xl">
                  <canvas ref={qrRef} />
                </div>
                
                <p className="text-center text-white/50 text-xs px-8">
                  Scan this QR code on another device to start playing exactly where you left off.
                </p>
                
                <button onClick={onClose} className="w-full py-4 bg-white/10 text-white rounded-full font-bold text-sm">
                  Done
                </button>
              </div>
            )}
          </motion.div>

          <style jsx>{`
            .receipt-style {
              border-bottom: 8px dashed rgba(255,255,255,0.1);
              background: #fdfdfd;
              color: #121212 !important;
            }
            .receipt-style p { color: #121212 !important; }
            .receipt-style .bg-white\/10 { background-color: rgba(0,0,0,0.1); }
            .receipt-style .text-white\/30 { color: rgba(0,0,0,0.4) !important; }
            
            .polaroid-style {
              padding-bottom: 40px;
              background: #fff;
              color: #121212;
              border: 12px solid #fff;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .polaroid-style p { color: #121212 !important; }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
