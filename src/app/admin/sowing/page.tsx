import { getSowings } from '@/actions/sowing';
import { Heart, Search, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import SowingTable from '@/components/admin/SowingTable';

export const dynamic = 'force-dynamic';

export default async function AdminSowingPage() {
  const res = await getSowings();
  const sowings = res.success ? res.data! : [];

  const totalAmount = sowings.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sowing Records</h1>
          <p className="text-slate-400 mt-2">Track financial sowing from participants.</p>
        </div>
        <div className="bg-poster-accent/10 border border-poster-accent/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-poster-accent/20 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-poster-accent" />
          </div>
          <div>
            <p className="text-sm text-poster-accent font-medium">Total Sowed</p>
            <p className="text-2xl font-bold text-white font-mono">RM {totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <SowingTable initialSowings={sowings} />
    </div>
  );
}
