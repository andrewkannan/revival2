import { getPhotos } from '@/actions/photos';
import { getAdminConfig } from '@/actions/admin';
import Itinerary from '@/components/Itinerary';
import PhotoAlbum from '@/components/PhotoAlbum';
import PrayerWall from '@/components/PrayerWall';
import TestimonyBox from '@/components/TestimonyBox';
import SowPanel from '@/components/SowPanel';
import WorshipPlaylist from '@/components/WorshipPlaylist';
import CountdownLock from '@/components/CountdownLock';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ShortcutDock from '@/components/ShortcutDock';
import TranslatedFooter from '@/components/TranslatedFooter';
import Image from 'next/image';

export const revalidate = 0; // Ensures fresh data for the live announcement and prayers

export default async function ItineraryPage() {
  const [photosRes, adminConfig] = await Promise.all([
    getPhotos(),
    getAdminConfig()
  ]);

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden relative">
      <LanguageSwitcher />
      {/* Live Calvary Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#263336]/95 via-[#263336]/80 to-black/95"></div>
        <div className="absolute inset-0 w-full h-full scale-[1.75] origin-center md:scale-100 transition-transform duration-1000">
          <div className="absolute inset-0 w-full h-full animate-[ambientPan_60s_ease-in-out_infinite_alternate] opacity-40">
            <Image 
              src="/backgrounds/calvary-bg.png" 
              alt="Calvary Background" 
              fill 
              className="object-cover object-center"
              quality={100}
              priority
            />
          </div>
        </div>
        {/* Subtle animated fog overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#263336] to-transparent z-20"></div>
      </div>
      
      {/* Top Logo */}
      <div className="pt-8 flex flex-col items-center px-4 w-full relative z-10">
        <div className="relative w-full max-w-[200px] md:max-w-[280px] aspect-[5/1] mb-6">
          <Image src="/hero/revival-logo.png" alt="Revival Logo" fill className="object-contain drop-shadow-xl" priority />
        </div>

        {/* Social Media Links */}
        <div className="flex gap-4 items-center">
          {adminConfig?.instagramUrl && (
            <a href={adminConfig.instagramUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-110">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          )}
          {adminConfig?.tiktokUrl && (
            <a href={adminConfig.tiktokUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-110">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.34 6.34 0 0 0 6.25-6.36V8.05a8.36 8.36 0 0 0 4.39 1.44V6.15a5.22 5.22 0 0 1-2.32-.46z"></path>
              </svg>
            </a>
          )}
          {adminConfig?.youtubeUrl && (
            <a href={adminConfig.youtubeUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-110">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Sleek Shortcut Navigation - Single View Dock */}
      <ShortcutDock playlistUrl={adminConfig?.playlistUrl} />

      <div className="pb-24 flex flex-col gap-8 md:gap-16 relative z-10">
        <section>
          <Itinerary isBreakoutQALocked={adminConfig?.isBreakoutQALocked ?? true} />
        </section>

        {adminConfig?.playlistUrl && (
          <section id="worship" className="scroll-mt-24">
            <WorshipPlaylist playlistUrl={adminConfig.playlistUrl} />
          </section>
        )}

        <section id="prayers" className="scroll-mt-24">
          <CountdownLock 
            titleKey="itineraryPage.unlockPrayerWall"
            isLocked={adminConfig?.isPrayerLocked} 
            unlockTime={adminConfig?.prayerUnlockTime ? new Date(adminConfig.prayerUnlockTime).toISOString() : undefined}
          >
            <PrayerWall />
          </CountdownLock>
        </section>

        <section id="photos" className="scroll-mt-24">
          <CountdownLock 
            titleKey="itineraryPage.unlockGallery"
            isLocked={adminConfig?.isGalleryLocked} 
            unlockTime={adminConfig?.galleryUnlockTime ? new Date(adminConfig.galleryUnlockTime).toISOString() : undefined}
          >
            <PhotoAlbum photos={photosRes.success ? photosRes.data! : []} />
          </CountdownLock>
        </section>

        <section id="testimonies" className="scroll-mt-24">
          <CountdownLock 
            titleKey="itineraryPage.unlockTestimonies"
            isLocked={adminConfig?.isTestimonyLocked} 
            unlockTime={adminConfig?.testimonyUnlockTime ? new Date(adminConfig.testimonyUnlockTime).toISOString() : undefined}
          >
            <TestimonyBox />
          </CountdownLock>
        </section>

        <section id="sow" className="scroll-mt-24">
          <SowPanel />
        </section>

        {/* Footer */}
        <TranslatedFooter />
      </div>
    </main>
  );
}
