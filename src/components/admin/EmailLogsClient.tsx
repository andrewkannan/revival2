'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react';
import RetryEmailButton from './RetryEmailButton';
import ExportCsvButton from './ExportCsvButton';

export default function EmailLogsClient({ initialLogs }: { initialLogs: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = initialLogs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.to && log.to.toLowerCase().includes(searchLower)) ||
      (log.subject && log.subject.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-poster-accent transition-colors"
          />
        </div>
        <ExportCsvButton data={filteredLogs} filename="email-logs-export" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Recipient</th>
                <th className="px-4 py-4 font-medium">Subject</th>
                <th className="px-4 py-4 font-medium">Sent At</th>
                <th className="px-4 py-4 font-medium">Error Info</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Mail className="w-8 h-8 mb-2 opacity-50" />
                      <p>{searchTerm ? 'No emails found matching your search.' : 'No emails have been sent yet.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${
                      log.status === 'FAILED' ? 'bg-red-500/5 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.status === 'SENT' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-4 h-4" /> <span className="font-medium text-xs">SENT</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full w-fit">
                            <XCircle className="w-4 h-4" /> <span className="font-medium text-xs">FAILED</span>
                          </div>
                          <RetryEmailButton logId={log.id} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-white">{log.to}</td>
                    <td className="px-4 py-4 text-slate-300">{log.subject}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 break-words whitespace-pre-wrap">
                      {log.error ? (
                        log.error.startsWith('[Success]') ? (
                          <span className="text-emerald-400/80" title={log.error}>
                            {log.error}
                          </span>
                        ) : (
                          <span className="text-red-400/80 cursor-help" title={log.error}>
                            <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                            {log.error}
                          </span>
                        )
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
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
