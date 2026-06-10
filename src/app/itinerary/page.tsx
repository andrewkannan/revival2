import { getAdminConfig } from '@/actions/admin';
import { getApprovedPrayers } from '@/actions/spiritual';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import ItineraryTabs from '@/components/ItineraryTabs';

export const revalidate = 0; // Ensures fresh data for the live announcement and prayers

export default async function ItineraryPage() {
  const config = await getAdminConfig();
  const announcement = config?.liveAnnouncement || null;
  const prayersRes = await getApprovedPrayers();

  return (
    <main className="min-h-screen bg-[#263336] overflow-x-hidden">
      <AnnouncementBanner announcement={announcement} />
      
      <ItineraryTabs initialPrayers={prayersRes.success ? prayersRes.data : []} />
    </main>
  );
}
