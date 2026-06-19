'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar, X, Eye, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

type SortColumn = 'orderNumber' | 'attendeeName' | 'type' | 'uploadedAt';
type SortDirection = 'asc' | 'desc';

export default function ReceiptsClient({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{url: string, title: string} | null>(null);
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 group-hover:opacity-100" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-poster-accent" />
      : <ArrowDown className="w-3 h-3 ml-1 text-poster-accent" />;
  };

  const filteredAndSortedReceipts = useMemo(() => {
    let result = initialReceipts.filter(receipt => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        receipt.attendeeName.toLowerCase().includes(searchLower) ||
        receipt.attendeeEmail.toLowerCase().includes(searchLower) ||
        receipt.orderNumber.toString().includes(searchLower);

      // Date range filter
      let matchesDate = true;
      if (startDate || endDate) {
        if (receipt.uploadedAt) {
          const receiptDateStr = new Date(receipt.uploadedAt).toISOString().split('T')[0];
          
          if (startDate && endDate) {
            matchesDate = receiptDateStr >= startDate && receiptDateStr <= endDate;
          } else if (startDate) {
            matchesDate = receiptDateStr >= startDate;
          } else if (endDate) {
            matchesDate = receiptDateStr <= endDate;
          }
        } else {
          matchesDate = false; // Exclude if no date and we are filtering
        }
      }

      return matchesSearch && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'orderNumber':
          comparison = a.orderNumber - b.orderNumber;
          break;
        case 'attendeeName':
          comparison = a.attendeeName.localeCompare(b.attendeeName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'uploadedAt':
          const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialReceipts, searchTerm, startDate, endDate, sortColumn, sortDirection]);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("receipts");
      
      if (!folder) throw new Error("Failed to create zip folder");

      for (const receipt of filteredAndSortedReceipts) {
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
      a.download = `Receipts_${startDate || 'start'}_to_${endDate || 'end'}.zip`;
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
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 relative w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-poster-accent/50"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1">
            <span className="absolute -top-5 left-1 text-xs text-slate-400">Start Date</span>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-poster-accent/50 text-sm"
            />
            {startDate && (
              <button onClick={() => setStartDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-slate-500 mt-2">-</span>
          <div className="relative flex-1">
            <span className="absolute -top-5 left-1 text-xs text-slate-400">End Date</span>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-poster-accent/50 text-sm"
            />
            {endDate && (
              <button onClick={() => setEndDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading || filteredAndSortedReceipts.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-poster-accent text-poster-bg rounded-xl font-bold hover:bg-poster-accent-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto whitespace-nowrap"
        >
          {isDownloading ? (
            <span className="animate-spin text-xl leading-none">⟳</span>
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download ZIP ({filteredAndSortedReceipts.length})
        </button>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer group select-none" onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center">Order <SortIcon column="orderNumber" /></div>
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer group select-none" onClick={() => handleSort('attendeeName')}>
                  <div className="flex items-center">Attendee <SortIcon column="attendeeName" /></div>
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer group select-none" onClick={() => handleSort('type')}>
                  <div className="flex items-center">Type <SortIcon column="type" /></div>
                </th>
                <th className="px-6 py-4 font-medium cursor-pointer group select-none" onClick={() => handleSort('uploadedAt')}>
                  <div className="flex items-center">Upload Date <SortIcon column="uploadedAt" /></div>
                </th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedReceipts.map(receipt => (
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
              {filteredAndSortedReceipts.length === 0 && (
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
