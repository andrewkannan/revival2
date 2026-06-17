import { getSowings } from '@/actions/sowing';
import { Heart, Search, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

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

      <div className="bg-[#1c272a]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search records (UI only)..." 
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              disabled
            />
          </div>
          <div className="text-sm font-medium text-slate-400">
            {sowings.length} Record{sowings.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Outreach</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sowings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Heart className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No sowing records found.</p>
                  </td>
                </tr>
              ) : (
                sowings.map((sowing) => (
                  <tr key={sowing.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {new Date(sowing.createdAt).toLocaleDateString()}
                      <div className="text-xs text-slate-500">{new Date(sowing.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {sowing.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {sowing.outreach.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-poster-accent-bright text-base">
                      RM {Number(sowing.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={sowing.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium text-slate-300 hover:text-white"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Receipt
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
