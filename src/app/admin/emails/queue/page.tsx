import { getEmailQueue, getAdminConfig } from '@/actions/admin';
import EmailQueueClient from '@/components/admin/EmailQueueClient';

export const dynamic = 'force-dynamic';

export default async function EmailQueuePage() {
  const { success, queue } = await getEmailQueue();
  const config = await getAdminConfig();
  const isPaused = config.isEmailQueuePaused || false;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Queue</h1>
        <p className="text-slate-400 mt-2">Track and trace the status of rate-limited emails waiting to be sent.</p>
      </div>

      <EmailQueueClient initialQueue={queue || []} initialPaused={isPaused} />
    </div>
  );
}
