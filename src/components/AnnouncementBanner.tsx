'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  announcement: string | null;
}

export default function AnnouncementBanner({ announcement }: Props) {
  const [isVisible, setIsVisible] = useState(true);

  if (!announcement || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, margin: 0 }}
        className="bg-poster-accent text-black font-semibold px-4 py-3 shadow-lg z-50 fixed top-0 left-0 right-0 w-full border-b border-black/10"
      >
        <div className="max-w-4xl mx-auto flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm sm:text-base leading-snug">{announcement}</p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
