'use client';

import { Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 text-center py-24">
        <ImageIcon className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('photoAlbum.emptyTitle')}</h2>
        <p className="text-slate-400">{t('photoAlbum.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="w-full relative py-8 overflow-hidden max-w-[1400px] mx-auto px-4">
      <div className="bg-[#1c272a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-poster-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-poster-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-12 relative z-10 px-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-poster-accent to-white drop-shadow-[0_0_25px_rgba(205,255,100,0.4)] mb-4">
            {t('photoAlbum.title')}
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto uppercase tracking-widest font-medium">{t('photoAlbum.subtitle')}</p>
        </div>

        <div className="w-full relative mx-auto pb-4">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            initialSlide={Math.floor(photos.length / 2)}
            speed={800}
            touchRatio={1.5}
            coverflowEffect={{
              rotate: 15, 
              stretch: 0,
              depth: 150,
              modifier: 1.2,
              slideShadows: true,
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
            className="w-full pt-4 pb-16 px-4"
          >
            {photos.map((photo) => (
              <SwiperSlide key={photo.id} className="w-[75vw] sm:w-[350px] md:w-[450px] lg:w-[500px]">
                <div className="group relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black/50 aspect-[8.5/11] transform transition-all duration-500">
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
