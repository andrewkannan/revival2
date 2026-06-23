'use client';

import { useState } from 'react';
import { Sowing } from '@prisma/client';
import { Heart, Image as ImageIcon, Search, Edit2, Trash2, Loader2, X, Upload, Download } from 'lucide-react';
import JSZip from 'jszip';
import { editSowing, deleteSowing } from '@/actions/sowing';

export default function SowingTable({ initialSowings }: { initialSowings: Sowing[] }) {
  const [sowings, setSowings] = useState(initialSowings);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; amount: number; receiptUrl: string }>({ name: '', amount: 0, receiptUrl: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{url: string, title: string} | null>(null);

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
    const remark = prompt("Please provide a reason for deleting this record:");
    if (remark === null) return; // User cancelled
    
    setLoading(true);
    const res = await deleteSowing(id, remark);
    if (res.success) {
      setSowings(prev => prev.map(s => s.id === id ? { ...s, deletedAt: new Date() as any, deleteRemark: remark as any } : s));
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

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("sowing_receipts");
      
      if (!folder) throw new Error("Failed to create zip folder");

      for (const sowing of filtered) {
        if ((sowing as any).deletedAt) continue; // Skip deleted records
        if (!sowing.receiptUrl) continue;
        let data = sowing.receiptUrl;
        let extension = 'png';
        if (data.includes('jpeg') || data.includes('jpg')) extension = 'jpg';
        if (data.includes('pdf')) extension = 'pdf';

        const base64Data = data.includes(',') ? data.split(',')[1] : data;
        const filename = `Sowing_${sowing.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(sowing.createdAt).toISOString().split('T')[0]}.${extension}`;
        
        folder.file(filename, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sowing_Receipts.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error("Failed to generate ZIP", error);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsDownloading(false);
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
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-400 hidden sm:block">
            {filtered.length} Record{filtered.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading || filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-poster-accent text-poster-bg rounded-lg font-bold hover:bg-poster-accent-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isDownloading ? (
              <span className="animate-spin text-xl leading-none">⟳</span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Download ZIP</span>
          </button>
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
                <tr key={sowing.id} className={`hover:bg-white/5 transition-colors ${(sowing as any).deletedAt ? "opacity-50 grayscale" : ""}`}>
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
                    ) : (
                      <>
                        {sowing.name}
                        {(sowing as any).deletedAt && (
                          <div className="text-xs text-red-400 mt-1 font-normal break-words whitespace-normal max-w-[200px]">
                            Deleted: {(sowing as any).deleteRemark || 'No reason provided'}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-mono font-bold text-base ${(sowing as any).deletedAt ? 'text-slate-500 line-through' : 'text-poster-accent-bright'}`}>
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
                      <button 
                        onClick={() => setPreviewModal({ url: sowing.receiptUrl, title: sowing.name })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium text-slate-300 hover:text-white"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Receipt
                      </button>
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
                        {!(sowing as any).deletedAt && (
                          <>
                            <button onClick={() => handleEdit(sowing)} disabled={loading} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(sowing.id)} disabled={loading} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 bg-white/5 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {previewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewModal(null)}>
          <div className="relative max-w-4xl w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Receipt Preview <span className="text-slate-400 text-sm font-normal ml-2">{previewModal.title}</span></h3>
              <button onClick={() => setPreviewModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex items-center justify-center bg-black/50 min-h-[300px]">
              {previewModal.url.includes('pdf') ? (
                <iframe src={previewModal.url} className="w-full h-[600px] rounded-lg" />
              ) : (
                <img src={previewModal.url} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
