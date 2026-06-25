import { getAnalyticsData } from '@/actions/analytics';
import { Activity, Navigation, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsDashboard() {
  const analyticsRes = await getAnalyticsData();
  const data = analyticsRes.data;

  if (!analyticsRes.success || !data) {
    return (
      <div className="p-8 text-red-400 bg-red-400/10 rounded-xl border border-red-500/20">
        Failed to load analytics data: {analyticsRes.message}
      </div>
    );
  }

  // Find the maximum daily visits to scale the bar chart
  const maxVisits = data.visitsByDay.reduce((max, d) => Math.max(max, d.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Analytics</h1>
        <p className="text-slate-400 mt-2">Track page visits and user engagement across the site.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Activity className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h2 className="text-lg font-medium text-slate-400 mb-2">Total Page Views</h2>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold tracking-tighter text-white">{data.totalVisits}</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">All time site-wide visits</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Visited Paths */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-poster-accent/10 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5 text-poster-accent" />
            </div>
            <h3 className="text-xl font-semibold">Top Pages</h3>
          </div>
          
          <div className="space-y-4">
            {data.visitsByPath.length === 0 ? (
              <p className="text-slate-500 italic">No data yet.</p>
            ) : (
              data.visitsByPath.map((item, i) => (
                <div key={item.path} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4 truncate">
                    <span className="text-slate-500 font-mono text-sm w-4">{i + 1}.</span>
                    <span className="text-white font-medium truncate">{item.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-poster-accent font-bold">{item.count}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Views</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Traffic Trend (7 days) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold">Traffic (Last 7 Days)</h3>
          </div>

          <div className="h-64 flex items-end gap-2 mt-4 pt-4 border-t border-white/5">
            {data.visitsByDay.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                No recent traffic data.
              </div>
            ) : (
              data.visitsByDay.map((day) => {
                const heightPercentage = Math.max(5, (day.count / maxVisits) * 100);
                const dateObj = new Date(day.date);
                const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex justify-center h-full items-end">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-1 rounded-lg text-xs whitespace-nowrap z-10 pointer-events-none">
                        {day.count} views
                      </div>
                      <div 
                        className="w-full max-w-[40px] bg-emerald-500/80 rounded-t-lg transition-all duration-500 ease-out hover:bg-emerald-400"
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{dayStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
