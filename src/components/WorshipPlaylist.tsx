'use client';

import { Music, PlayCircle, Disc } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';

export default function WorshipPlaylist({ playlistUrl }: { playlistUrl: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!playlistUrl || !mounted) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-[#1c272a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-poster-accent/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-poster-accent/20 transition-colors duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-poster-accent text-xs font-medium tracking-wide uppercase mb-2">
              <Music className="w-3.5 h-3.5" />
              Prepare Your Heart
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent tracking-tight">
              Worship Playlist
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto md:mx-0">
              Listen to the songs we will be singing at REVIVAL. Let these melodies minister to you and prepare your heart for an encounter with God.
            </p>
            
            <div className="flex items-center gap-2 justify-center md:justify-start pt-4 text-xs font-medium text-slate-500">
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>Now Playing from YouTube</span>
            </div>
          </div>

          {/* YouTube iframe container */}
          <div className="w-full md:w-1/2 shrink-0 relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 aspect-video bg-black flex items-center justify-center">
            <ReactPlayer 
              url={playlistUrl}
              width="100%"
              height="100%"
              controls={true}
              config={{
                youtube: {
                  // @ts-ignore - react-player types are slightly misaligned with their actual API
                  playerVars: { 
                    origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                  }
                }
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
