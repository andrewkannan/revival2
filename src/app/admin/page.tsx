import { getDashboardStats } from '@/actions/admin';
import { getActiveLocksCount } from '@/lib/ticket-lock';
import ReminderButton from '@/components/ReminderButton';

export const dynamic = 'force-dynamic';
import { Users, Ticket, Clock, CheckCircle2, AlertCircle, Banknote, MapPin } from 'lucide-react';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const locks = await getActiveLocksCount();

  const totalAdultsTaken = stats.securedAdults + stats.pendingAdults + locks.activeAdults;
  const availableAdultSeats = Math.max(0, stats.adultCapacity - totalAdultsTaken);
  const fillAdultPercentage = Math.min(100, Math.round((totalAdultsTaken / stats.adultCapacity) * 100)) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-2">Real-time capacity and registration statistics.</p>
        </div>
        <ReminderButton />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Adult Capacity Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Ticket className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-lg font-medium text-slate-400 mb-2">Adult Capacity Remaining</h2>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold tracking-tighter">{availableAdultSeats}</span>
              <span className="text-lg text-slate-500 font-medium">/ {stats.adultCapacity} seats</span>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-400">Filled ({fillAdultPercentage}%)</span>
                <span className="text-white">{totalAdultsTaken} taken</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-poster-accent h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${fillAdultPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-slate-400">Total Groups</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
          <p className="text-sm text-slate-500 mt-1">Unique registrations</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-medium text-slate-400">Paid Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400">RM {stats.totalPaidAmount.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-1">From secured seats</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-medium text-slate-400">Pending Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400">RM {stats.totalPendingAmount.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-1">Awaiting payment/review</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-medium text-slate-400">Secured</h3>
          </div>
          <p className="text-3xl font-bold text-poster-accent">{stats.securedAdults}</p>
          <p className="text-sm text-slate-500 mt-1">Tickets</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-medium text-slate-400">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400">{stats.pendingAdults}</p>
          <p className="text-sm text-slate-500 mt-1">Tickets</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-medium text-slate-400">Active Locks</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">{locks.activeAdults}</p>
          <p className="text-sm text-slate-500 mt-1">Tickets</p>
        </div>
      </div>

      {/* Outreach Locations */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Outreach Locations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats.outreachCounts || {}).sort((a, b) => b[1].total - a[1].total).map(([location, countStats]) => (
            <div key={location} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-poster-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-poster-accent" />
                </div>
                <h3 className="font-medium text-slate-300 text-sm truncate" title={location.replace('_', ' ')}>{location.replace('_', ' ')}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{countStats.total}</p>
                <p className="text-xs text-slate-500">Registrations</p>
              </div>
              <div className="mt-4 flex flex-col gap-1 text-sm border-t border-white/5 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Secured:</span>
                  <span className="font-medium text-emerald-400">{countStats.secured}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending:</span>
                  <span className="font-medium text-amber-400">{countStats.pending}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
