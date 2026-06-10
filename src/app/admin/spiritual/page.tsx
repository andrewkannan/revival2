import { getAllPrayers, getTestimonies, approvePrayer, deletePrayer, deleteTestimony } from '@/actions/spiritual';
import { Heart, MessageSquare, Check, Trash2 } from 'lucide-react';
import SpiritualAdminClient from './SpiritualAdminClient';

export const revalidate = 0;

export default async function SpiritualAdminPage() {
  const [prayersRes, testimoniesRes] = await Promise.all([
    getAllPrayers(),
    getTestimonies()
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spiritual Engagement</h1>
        <p className="text-slate-400 mt-2">Manage live prayer requests and view submitted testimonies.</p>
      </div>

      <SpiritualAdminClient 
        initialPrayers={prayersRes.success ? prayersRes.data : []} 
        initialTestimonies={testimoniesRes.success ? testimoniesRes.data : []} 
      />
    </div>
  );
}
