import { getEmailLogs } from '@/actions/admin';
import EmailLogsClient from '@/components/admin/EmailLogsClient';
import ConferenceEveEmailControls from '@/components/admin/ConferenceEveEmailControls';
import PostEventEmailControls from '@/components/admin/PostEventEmailControls';

export const dynamic = 'force-dynamic';

export default async function EmailLogsPage() {
  const { success, logs } = await getEmailLogs();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Logs</h1>
        <p className="text-slate-400 mt-2">Track the delivery status of all automated emails sent by the system.</p>
      </div>

      <PostEventEmailControls />
      <ConferenceEveEmailControls />

      <EmailLogsClient initialLogs={logs || []} />
    </div>
  );
}
