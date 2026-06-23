'use client';

import { Music, PlayCircle, Disc } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function WorshipPlaylist({ playlistUrl }: { playlistUrl: string }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!playlistUrl || !mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-[#1c272a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group [-webkit-mask-image:-webkit-radial-gradient(white,black)]">
        
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-poster-accent/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-poster-accent/20 transition-colors duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-poster-accent text-xs font-medium tracking-wide uppercase mb-2">
              <Music className="w-3.5 h-3.5" />
              {t('worshipPlaylist.tag')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent tracking-tight">
              {t('worshipPlaylist.title')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto md:mx-0">
              {t('worshipPlaylist.subtitle')}
            </p>
            
            <div className="flex items-center gap-2 justify-center md:justify-start pt-4 text-xs font-medium text-slate-500">
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>{t('worshipPlaylist.nowPlaying')}</span>
            </div>
          </div>

          {/* Listen on YouTube Redirect Panel */}
          <div className="w-full md:w-1/2 shrink-0 relative flex items-center justify-center">
            <a 
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center justify-center w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#ff0000]/10 to-[#ff0000]/30 border border-[#ff0000]/20 hover:border-[#ff0000]/40 transition-all duration-500 shadow-2xl"
            >
              <div className="absolute inset-0 bg-[#0f171a]/50 group-hover:bg-[#0f171a]/30 transition-colors duration-500"></div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-500">
                <div className="w-32 h-32 rounded-full bg-[#ff0000]/40 blur-[40px]"></div>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-5 transform group-hover:-translate-y-2 transition-transform duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#ff0000] to-[#cc0000] text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] group-hover:shadow-[0_0_50px_rgba(255,0,0,0.6)] transition-shadow duration-500 relative">
                  {/* YouTube style play triangle */}
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors duration-300">
                    {t('worshipPlaylist.listenOn')}
                  </h3>
                  <p className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors duration-300 flex items-center justify-center gap-1.5">
                    {t('worshipPlaylist.clickToOpen')} <PlayCircle className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
