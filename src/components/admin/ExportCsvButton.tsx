'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface ExportCsvButtonProps {
  data: any[];
  filename: string;
}

export default function ExportCsvButton({ data, filename }: ExportCsvButtonProps) {
  const exportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header];
          if (cell === null || cell === undefined) {
            cell = '';
          } else if (cell instanceof Date) {
            cell = cell.toLocaleString();
          } else if (typeof cell === 'object') {
            cell = JSON.stringify(cell);
          } else {
            cell = String(cell);
          }
          
          cell = cell.replace(/"/g, '""');
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={exportCSV} 
      disabled={!data || data.length === 0}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border bg-white/5 text-white border-white/20 hover:bg-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" /> Export CSV
    </button>
  );
}
