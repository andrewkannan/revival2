'use client';

import { useState } from 'react';
import { approvePrayer, deletePrayer, deleteTestimony } from '@/actions/spiritual';
import { Check, Trash2, Heart, MessageSquare } from 'lucide-react';

export default function SpiritualAdminClient({ initialPrayers, initialTestimonies }: { initialPrayers: any[], initialTestimonies: any[] }) {
  const [prayers, setPrayers] = useState(initialPrayers);
  const [testimonies, setTestimonies] = useState(initialTestimonies);
  const [activeTab, setActiveTab] = useState<'prayers' | 'testimonies'>('prayers');

  const handleApprovePrayer = async (id: string) => {
    setPrayers(current => current.map(p => p.id === id ? { ...p, isApproved: true } : p));
    await approvePrayer(id);
  };

  const handleDeletePrayer = async (id: string) => {
    if (window.confirm('Delete this prayer request permanently?')) {
      setPrayers(current => current.filter(p => p.id !== id));
      await deletePrayer(id);
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    if (window.confirm('Delete this testimony permanently?')) {
      setTestimonies(current => current.filter(t => t.id !== id));
      await deleteTestimony(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('prayers')}
          className={`pb-4 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'prayers' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Heart className="w-4 h-4" /> Prayer Wall 
          {prayers.filter(p => !p.isApproved).length > 0 && (
            <span className="bg-poster-accent text-black text-xs px-2 py-0.5 rounded-full font-bold">
              {prayers.filter(p => !p.isApproved).length} Pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('testimonies')}
          className={`pb-4 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'testimonies' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" /> Testimonies ({testimonies.length})
        </button>
      </div>

      {activeTab === 'prayers' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Author</th>
                <th className="px-6 py-4 font-medium">Request</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prayers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No prayer requests.</td>
                </tr>
              ) : (
                prayers.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{p.authorName}</td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 max-w-md">{p.content}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          Approved ({p.prayCount} praying)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!p.isApproved && (
                          <button onClick={() => handleApprovePrayer(p.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeletePrayer(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'testimonies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonies.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 py-12 bg-white/5 rounded-2xl border border-white/10">
              No testimonies submitted yet.
            </div>
          ) : (
            testimonies.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative group">
                <button 
                  onClick={() => handleDeleteTestimony(t.id)}
                  className="absolute top-4 right-4 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg"
                  title="Delete Testimony"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-poster-accent/20 flex items-center justify-center text-poster-accent font-bold">
                      {t.authorName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{t.authorName}</h3>
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed italic">&quot;{t.content}&quot;</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
