import { getApprovedPrayers, getApprovedTestimonies } from '@/actions/spiritual';
import Itinerary from '@/components/Itinerary';
import VenueMap from '@/components/VenueMap';
import PrayerWall from '@/components/PrayerWall';
import TestimonyBox from '@/components/TestimonyBox';
import { MapPin, Heart, MessageSquare } from 'lucide-react';
import Image from 'next/image';

import SowPanel from '@/components/SowPanel';

export const revalidate = 0; // Ensures fresh data for the live announcement and prayers

export default async function ItineraryPage() {
  const [prayersRes, testimoniesRes] = await Promise.all([
    getApprovedPrayers(),
    getApprovedTestimonies()
  ]);

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden relative">
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
      <div className="pt-8 flex justify-center px-4 w-full relative z-10">
        <div className="relative w-full max-w-[200px] md:max-w-[280px] aspect-[5/1]">
          <Image src="/hero/revival-logo.png" alt="Revival Logo" fill className="object-contain drop-shadow-xl" priority />
        </div>
      </div>

      {/* Sticky Shortcut Navigation - Floating Pill */}
      <div className="sticky top-6 z-40 px-4 flex justify-center pointer-events-none mt-6">
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
            <span className="sm:hidden tracking-wide uppercase">Testimonies</span>
          </a>
          <a href="#sow" className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
            <Heart className="w-4 h-4 text-poster-accent" /> 
            <span className="hidden sm:inline tracking-wide uppercase">Sow</span>
            <span className="sm:hidden tracking-wide uppercase">Sow</span>
          </a>
        </div>
      </div>

      <div className="pb-24 divide-y divide-white/10 flex flex-col relative z-10">
        <section>
          <Itinerary />
        </section>

        <section id="prayer" className="py-8 md:py-12 scroll-mt-24">
          <PrayerWall initialPrayers={prayersRes.success ? prayersRes.data : []} />
        </section>

        <section id="testimony" className="py-8 md:py-12 scroll-mt-24">
          <TestimonyBox initialTestimonies={testimoniesRes.data || []} />
        </section>

        <section id="sow" className="py-8 md:py-12 scroll-mt-24">
          <SowPanel />
        </section>

        <section id="venue" className="py-8 md:py-12 scroll-mt-24">
          <VenueMap />
        </section>
      </div>
    </main>
  );
}
