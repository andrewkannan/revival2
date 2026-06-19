'use client';

import React, { useState } from 'react';
import { Search, Download, Calendar, X, Eye, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';

interface Receipt {
  id: string;
  registrationId: string;
  orderNumber: number;
  attendeeName: string;
  attendeeEmail: string;
  url: string;
  uploadedAt: string | null;
  type: string;
}

export default function ReceiptsClient({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{url: string, title: string} | null>(null);

  const filteredReceipts = initialReceipts.filter(receipt => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      receipt.attendeeName.toLowerCase().includes(searchLower) ||
      receipt.attendeeEmail.toLowerCase().includes(searchLower) ||
      receipt.orderNumber.toString().includes(searchLower);

    // Date filter
    let matchesDate = true;
    if (dateFilter) {
      if (receipt.uploadedAt) {
        const receiptDate = new Date(receipt.uploadedAt).toISOString().split('T')[0];
        matchesDate = receiptDate === dateFilter;
      } else {
        matchesDate = false; // Exclude if no date and we are filtering
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("receipts");
      
      if (!folder) throw new Error("Failed to create zip folder");

      for (const receipt of filteredReceipts) {
        // Base64 starts with data:image/jpeg;base64, ...
        let data = receipt.url;
        let extension = 'png';
        if (data.includes('jpeg') || data.includes('jpg')) extension = 'jpg';
        if (data.includes('pdf')) extension = 'pdf';

        const base64Data = data.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, "");
        const filename = `Order_R${String(receipt.orderNumber).padStart(5, '0')}_${receipt.attendeeName.replace(/[^a-zA-Z0-9]/g, '_')}_${receipt.type}.${extension}`;
        
        folder.file(filename, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipts_${dateFilter || 'All'}.zip`;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-poster-accent/50"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-poster-accent/50"
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading || filteredReceipts.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-poster-accent text-poster-bg rounded-xl font-bold hover:bg-poster-accent-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <span className="animate-spin text-xl leading-none">⟳</span>
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download ZIP ({filteredReceipts.length})
        </button>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Attendee</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Upload Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReceipts.map(receipt => (
                <tr key={receipt.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-300">
                      R{String(receipt.orderNumber).padStart(5, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{receipt.attendeeName}</div>
                    <div className="text-xs text-slate-400">{receipt.attendeeEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-white/5 text-slate-300 rounded-md">
                      {receipt.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {receipt.uploadedAt ? new Date(receipt.uploadedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setPreviewModal({ url: receipt.url, title: `R${String(receipt.orderNumber).padStart(5, '0')} - ${receipt.attendeeName}` })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No receipts found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
