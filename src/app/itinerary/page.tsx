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
    <main className="min-h-screen bg-[#263336] overflow-x-hidden">
      <AnnouncementBanner announcement={announcement} />
      
      <div className="pt-8 md:pt-16 space-y-16 md:space-y-32 pb-24 divide-y divide-white/10">
        <section>
          <Itinerary />
          <VenueMap />
        </section>

        <section className="pt-16 md:pt-32">
          <PrayerWall initialPrayers={prayersRes.success ? prayersRes.data : []} />
        </section>

        <section className="pt-16 md:pt-32">
          <TestimonyBox />
        </section>
      </div>
    </main>
  );
}
