'use client';

import { Image as ImageIcon, Heart, MessageSquare, Music, Sprout } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ShortcutDockProps {
  playlistUrl?: string;
}

export default function ShortcutDock({ playlistUrl }: ShortcutDockProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-4 sm:top-6 z-50 px-2 sm:px-4 flex justify-center pointer-events-none mt-4 sm:mt-6">
      <div className="bg-[#1c272a]/85 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl sm:rounded-full flex justify-between sm:justify-center items-center gap-0.5 sm:gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto w-full max-w-[400px] sm:max-w-max">
        {playlistUrl && (
          <a href="#worship" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[9px] sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300">
            <Music className="w-4 h-4 sm:w-4 sm:h-4 text-poster-accent" /> 
            <span className="tracking-widest uppercase">{t('itineraryPage.playlist')}</span>
          </a>
        )}
        <a href="#prayers" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[9px] sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300">
          <Heart className="w-4 h-4 sm:w-4 sm:h-4 text-poster-accent" /> 
          <span className="tracking-widest uppercase">{t('itineraryPage.prayers')}</span>
        </a>
        <a href="#photos" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[9px] sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300">
          <ImageIcon className="w-4 h-4 sm:w-4 sm:h-4 text-poster-accent" /> 
          <span className="tracking-widest uppercase">{t('itineraryPage.gallery')}</span>
        </a>
        <a href="#testimonies" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[9px] sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300">
          <MessageSquare className="w-4 h-4 sm:w-4 sm:h-4 text-poster-accent" /> 
          <span className="tracking-widest uppercase">{t('itineraryPage.testimony')}</span>
        </a>
        <a href="#sow" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 flex-1 sm:flex-none sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[9px] sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300">
          <Sprout className="w-4 h-4 sm:w-4 sm:h-4 text-poster-accent" /> 
          <span className="tracking-widest uppercase">{t('itineraryPage.sow')}</span>
        </a>
      </div>
    </div>
  );
}
