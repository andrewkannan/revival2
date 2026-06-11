import { getAdminConfig } from '@/actions/admin';
import { getApprovedPrayers } from '@/actions/spiritual';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Itinerary from '@/components/Itinerary';
import VenueMap from '@/components/VenueMap';
import PrayerWall from '@/components/PrayerWall';
import TestimonyBox from '@/components/TestimonyBox';
import { MapPin, Heart, MessageSquare } from 'lucide-react';

export const revalidate = 0; // Ensures fresh data for the live announcement and prayers

export default async function ItineraryPage() {
  const config = await getAdminConfig();
  const announcement = config?.liveAnnouncement || null;
  const prayersRes = await getApprovedPrayers();

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden relative">
      <AnnouncementBanner announcement={announcement} />
      
      {/* Sticky Shortcut Navigation - Floating Pill */}
      <div className="sticky top-6 z-40 px-4 flex justify-center mb-8 pointer-events-none mt-4">
        <div className="bg-[#1c272a]/70 backdrop-blur-xl border border-white/10 p-1.5 rounded-full flex gap-1 shadow-2xl shadow-black/50 pointer-events-auto">
          <a href="#venue" className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
            <MapPin className="w-4 h-4 text-poster-accent" /> 
            <span className="hidden sm:inline tracking-wide uppercase">Venue Map</span>
            <span className="sm:hidden tracking-wide uppercase">Map</span>
          </a>
          <a href="#prayer" className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
            <Heart className="w-4 h-4 text-poster-accent" /> 
            <span className="hidden sm:inline tracking-wide uppercase">Prayer Wall</span>
            <span className="sm:hidden tracking-wide uppercase">Prayers</span>
          </a>
          <a href="#testimony" className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
            <MessageSquare className="w-4 h-4 text-poster-accent" /> 
            <span className="hidden sm:inline tracking-wide uppercase">Testimonies</span>
            <span className="sm:hidden tracking-wide uppercase">Stories</span>
          </a>
        </div>
      </div>

      <div className="space-y-16 md:space-y-32 pb-24 divide-y divide-white/10">
        <section>
          <Itinerary />
          <div id="venue" className="scroll-mt-24">
            <VenueMap />
          </div>
        </section>

        <section id="prayer" className="pt-16 md:pt-32 scroll-mt-24">
          <PrayerWall initialPrayers={prayersRes.success ? prayersRes.data : []} />
        </section>

        <section id="testimony" className="pt-16 md:pt-32 scroll-mt-24">
          <TestimonyBox />
        </section>
      </div>
    </main>
  );
}
