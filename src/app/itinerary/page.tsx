import { getAdminConfig } from '@/actions/admin';
import Itinerary from '@/components/Itinerary';
import VenueMap from '@/components/VenueMap';
import AnnouncementBanner from '@/components/AnnouncementBanner';

export const revalidate = 0; // Ensures fresh data for the live announcement

export default async function ItineraryPage() {
  const config = await getAdminConfig();
  const announcement = config?.liveAnnouncement || null;

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden">
      <AnnouncementBanner announcement={announcement} />
      
      {/* We apply pt-8 here since there's no Hero section above it on this dedicated route */}
      <div className="pt-8 md:pt-16">
        <Itinerary />
      </div>

      <VenueMap />
    </main>
  );
}
