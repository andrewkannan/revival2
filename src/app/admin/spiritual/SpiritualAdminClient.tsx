'use client';

import { useState } from 'react';
import { approvePrayer, deletePrayer, approveTestimony, deleteTestimony } from '@/actions/spiritual';
import { Check, Trash2, Heart, MessageSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SpiritualAdminClient({ initialPrayers, initialTestimonies }: { initialPrayers: any[], initialTestimonies: any[] }) {
  const [prayers, setPrayers] = useState(initialPrayers);
  const [testimonies, setTestimonies] = useState(initialTestimonies);
  const [activeTab, setActiveTab] = useState<'prayers' | 'testimonies'>('prayers');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleTabChange = (tab: 'prayers' | 'testimonies') => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = (items: any[]) => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const handleExportPdf = () => {
    if (selectedIds.size === 0) return;
    const doc = new jsPDF();
    const isPrayers = activeTab === 'prayers';
    
    doc.setFontSize(18);
    doc.text(`REVIVAL 2026 - Selected ${isPrayers ? 'Prayer Requests' : 'Testimonies'}`, 14, 22);
    
    const items = isPrayers ? prayers : testimonies;
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    
    const tableData = selectedItems.map(item => [
      item.authorName || 'Anonymous',
      new Date(item.createdAt).toLocaleDateString(),
      item.content
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Author', 'Date', 'Content']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [140, 174, 176] },
      styles: { fontSize: 10, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: { 2: { cellWidth: 120 } }
    });

    doc.save(`revival-${isPrayers ? 'prayers' : 'testimonies'}.pdf`);
  };

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

  const handleApproveTestimony = async (id: string) => {
    setTestimonies(current => current.map(t => t.id === id ? { ...t, isApproved: true } : t));
    await approveTestimony(id);
  };

  const handleDeleteTestimony = async (id: string) => {
    if (window.confirm('Delete this testimony permanently?')) {
      setTestimonies(current => current.filter(t => t.id !== id));
      await deleteTestimony(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10">
        <div className="flex gap-4">
          <button
            onClick={() => handleTabChange('prayers')}
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
            onClick={() => handleTabChange('testimonies')}
            className={`pb-4 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'testimonies' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> Testimonies
            {testimonies.filter(t => !t.isApproved).length > 0 && (
              <span className="bg-poster-accent text-black text-xs px-2 py-0.5 rounded-full font-bold">
                {testimonies.filter(t => !t.isApproved).length} Pending
              </span>
            )}
          </button>
        </div>
        
        {selectedIds.size > 0 && (
          <button
            onClick={handleExportPdf}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
          >
            Export {selectedIds.size} to PDF
          </button>
        )}
      </div>

      {activeTab === 'prayers' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox" checked={prayers.length > 0 && selectedIds.size === prayers.length} onChange={() => toggleAll(prayers)} className="rounded border-white/20 bg-white/5 cursor-pointer" />
                </th>
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
                  <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${selectedIds.has(p.id) ? 'bg-white/[0.04]' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} className="rounded border-white/20 bg-white/5 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white whitespace-pre-wrap">{p.content}</div>
                      <div className="text-xs text-slate-400 mt-2">
                        By: <span className="font-medium text-slate-300">{p.authorName || 'Anonymous'}</span> • {new Date(p.createdAt).toLocaleDateString()}
                      </div>
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
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox" checked={testimonies.length > 0 && selectedIds.size === testimonies.length} onChange={() => toggleAll(testimonies)} className="rounded border-white/20 bg-white/5 cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-medium">Testimony</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No testimonies submitted yet.</td>
                </tr>
              ) : (
                testimonies.map(t => (
                  <tr key={t.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${selectedIds.has(t.id) ? 'bg-white/[0.04]' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelection(t.id)} className="rounded border-white/20 bg-white/5 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white whitespace-pre-wrap">"{t.content}"</div>
                      <div className="text-xs text-slate-400 mt-2">
                        By: <span className="font-medium text-slate-300">{t.authorName || 'Anonymous'}</span> • {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          Approved ({t.likeCount} praises)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!t.isApproved && (
                          <button onClick={() => handleApproveTestimony(t.id)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteTestimony(t.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20" title="Delete">
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
    </div>
  );
}
