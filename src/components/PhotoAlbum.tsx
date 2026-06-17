'use client';

import { Image as ImageIcon } from 'lucide-react';

interface Photo {
  id: string;
  imageUrl: string;
}

export default function PhotoAlbum({ photos }: { photos: Photo[] }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 text-center py-24">
        <ImageIcon className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Conference Gallery</h2>
        <p className="text-slate-400">Photos will be uploaded during the event.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Conference <span className="text-poster-accent">Gallery</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Relive the moments of Revival 2026</p>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {photos.map((photo) => (
          <div key={photo.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photo.imageUrl} 
              alt="Conference Photo" 
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
              <a 
                href={photo.imageUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors border border-white/20"
              >
                View Full
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
