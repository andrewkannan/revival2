'use client';

import { useState } from 'react';
import { Sowing } from '@prisma/client';
import { Heart, Image as ImageIcon, Search, Edit2, Trash2, Loader2, X, Upload } from 'lucide-react';
import { editSowing, deleteSowing } from '@/actions/sowing';

export default function SowingTable({ initialSowings }: { initialSowings: Sowing[] }) {
  const [sowings, setSowings] = useState(initialSowings);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; amount: number; receiptUrl: string }>({ name: '', amount: 0, receiptUrl: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filtered = sowings.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (sowing: Sowing) => {
    setEditingId(sowing.id);
    setEditData({ name: sowing.name, amount: Number(sowing.amount), receiptUrl: sowing.receiptUrl });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    const res = await editSowing(editingId, editData);
    if (res.success) {
      setSowings(prev => prev.map(s => s.id === editingId ? { ...s, name: editData.name, amount: editData.amount as any, receiptUrl: editData.receiptUrl } : s));
      setEditingId(null);
    } else {
      alert("Failed to edit sowing: " + res.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setLoading(true);
    const res = await deleteSowing(id);
    if (res.success) {
      setSowings(prev => prev.filter(s => s.id !== id));
    } else {
      alert("Failed to delete sowing: " + res.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setEditData(prev => ({ ...prev, receiptUrl: data.url }));
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#1c272a]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search records by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
        <div className="text-sm font-medium text-slate-400">
          {filtered.length} Record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Receipt</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <Heart className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No sowing records found.</p>
                </td>
              </tr>
            ) : (
              filtered.map((sowing) => (
                <tr key={sowing.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {new Date(sowing.createdAt).toLocaleDateString()}
                    <div className="text-xs text-slate-500">{new Date(sowing.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {editingId === sowing.id ? (
                      <input 
                        type="text" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        className="bg-black border border-white/20 rounded px-2 py-1 w-32"
                      />
                    ) : sowing.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-poster-accent-bright text-base">
                    {editingId === sowing.id ? (
                      <div className="flex items-center gap-1">
                        RM <input 
                          type="number" 
                          value={editData.amount} 
                          onChange={e => setEditData({...editData, amount: parseFloat(e.target.value)})}
                          className="bg-black border border-white/20 rounded px-2 py-1 w-24"
                        />
                      </div>
                    ) : (
                      `RM ${Number(sowing.amount).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === sowing.id ? (
                      <div className="flex flex-col gap-2">
                        <a href={editData.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-poster-accent hover:underline">Current Receipt</a>
                        <label className="cursor-pointer text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20 w-fit">
                          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Replace
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                      </div>
                    ) : (
                      <a 
                        href={sowing.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium text-slate-300 hover:text-white"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Receipt
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {editingId === sowing.id ? (
                      <>
                        <button onClick={handleSaveEdit} disabled={loading} className="px-3 py-1 bg-poster-accent text-black font-bold rounded-lg hover:bg-poster-accent-bright transition-colors text-xs">
                          {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Save'}
                        </button>
                        <button onClick={handleCancelEdit} disabled={loading} className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-xs">
                          <X className="w-3 h-3 inline" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(sowing)} disabled={loading} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sowing.id)} disabled={loading} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 bg-white/5 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
