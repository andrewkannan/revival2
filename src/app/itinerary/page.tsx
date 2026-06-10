import { getAdminConfig } from '@/actions/admin';
import { getApprovedPrayers } from '@/actions/spiritual';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Itinerary from '@/components/Itinerary';
import VenueMap from '@/components/VenueMap';
import PrayerWall from '@/components/PrayerWall';
import TestimonyBox from '@/components/TestimonyBox';

export const revalidate = 0; // Ensures fresh data for the live announcement and prayers

export default async function ItineraryPage() {
  const config = await getAdminConfig();
  const announcement = config?.liveAnnouncement || null;
  const prayersRes = await getApprovedPrayers();

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden relative">
      <AnnouncementBanner announcement={announcement} />
      
      {/* Sticky Shortcut Navigation */}
      <div className="sticky top-0 z-40 bg-[#263336]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <a href="#itinerary" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 text-white transition-colors">Schedule</a>
        <a href="#venue" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 text-white transition-colors">Venue Map</a>
        <a href="#prayer" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 text-white transition-colors">Prayer Wall</a>
        <a href="#testimony" className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 text-white transition-colors">Testimonies</a>
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
