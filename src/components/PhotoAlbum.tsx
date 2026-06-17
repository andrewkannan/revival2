'use client';

import { Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Photo {
  id: string;
  imageUrl: string;
}

export default function PhotoAlbum({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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
    <div className="w-full relative py-8 overflow-hidden">
      <div className="text-center mb-12 relative z-10 px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Conference <span className="text-poster-accent">Gallery</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Swipe to relive the moments of Revival 2026</p>
      </div>

      <div className="w-full relative max-w-[1400px] mx-auto px-4 pb-12">
        {/* Glow behind slider */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-64 bg-poster-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          initialSlide={Math.floor(photos.length / 2)}
          coverflowEffect={{
            rotate: 20, // Reduced rotation for a sleeker curve
            stretch: 0,
            depth: 250, // More depth
            modifier: 1.5,
            slideShadows: true,
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation={true}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
          className="w-full pt-12 pb-16 px-4"
        >
          {photos.map((photo) => (
            <SwiperSlide key={photo.id} className="w-[280px] sm:w-[350px] md:w-[450px] lg:w-[600px]">
              <div className="group relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black/50 aspect-[4/3] sm:aspect-video transform transition-all duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.imageUrl} 
                  alt="Conference Photo" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <button 
                    onClick={() => setSelectedPhoto(photo.imageUrl)}
                    className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all duration-300 border border-white/20 hover:scale-110 shadow-xl"
                  >
                    <Maximize2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedPhoto} 
              alt="Enlarged view" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}
      
      {/* Custom styles to override swiper navigation colors to match our theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-button-next, .swiper-button-prev {
          color: white !important;
          background: rgba(255,255,255,0.1);
          width: 50px !important;
          height: 50px !important;
          border-radius: 50%;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .swiper-button-next:hover, .swiper-button-prev:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.1);
        }
        .swiper-button-next::after, .swiper-button-prev::after {
          font-size: 20px !important;
          font-weight: bold;
        }
        .swiper-pagination-bullet {
          background: rgba(255,255,255,0.5) !important;
        }
        .swiper-pagination-bullet-active {
          background: #4ade80 !important; /* poster-accent */
          box-shadow: 0 0 10px #4ade80;
        }
        
        @media (max-width: 640px) {
          .swiper-button-next, .swiper-button-prev {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
