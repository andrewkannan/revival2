import { cookies } from 'next/headers';
import SpeakerLogin from '@/components/admin/SpeakerLogin';

export default async function BreakoutLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const isAuthenticated = c.get('speaker_auth')?.value === 'true';

  if (!isAuthenticated) {
    return <SpeakerLogin />;
  }

  return (
    <div className="min-h-screen bg-[#0b1013] text-white">
      {children}
    </div>
  );
}
