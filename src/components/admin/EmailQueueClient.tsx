'use client';

import React, { useState, useTransition } from 'react';
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Search, Pause, Play, Loader2 } from 'lucide-react';
import { toggleEmailQueue } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import ExportCsvButton from './ExportCsvButton';

export default function EmailQueueClient({ 
  initialQueue, 
  initialPaused 
}: { 
  initialQueue: any[]; 
  initialPaused: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleTogglePause = () => {
    startTransition(async () => {
      await toggleEmailQueue(!initialPaused);
      router.refresh();
    });
  };

  const filteredQueue = initialQueue.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.to && item.to.toLowerCase().includes(searchLower)) ||
      (item.subject && item.subject.toLowerCase().includes(searchLower))
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

        <div className="flex gap-2">
          <button
            onClick={handleTogglePause}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors border ${
              initialPaused 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : initialPaused ? (
              <Play className="w-4 h-4 fill-current" />
            ) : (
              <Pause className="w-4 h-4 fill-current" />
            )}
            {initialPaused ? 'Resume Sending' : 'Pause Queue'}
          </button>
          <ExportCsvButton data={initialQueue} filename="email-queue-export" />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Recipient</th>
                <th className="px-4 py-4 font-medium">Subject</th>
                <th className="px-4 py-4 font-medium">Queued At</th>
                <th className="px-4 py-4 font-medium">Sent At</th>
                <th className="px-4 py-4 font-medium">Attempts</th>
                <th className="px-4 py-4 font-medium">Error Info</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Mail className="w-8 h-8 mb-2 opacity-50" />
                      <p>{searchTerm ? 'No emails found matching your search.' : 'The queue is currently empty.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item: any) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${
                      item.status === 'FAILED' ? 'bg-red-500/5 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.status === 'SENT' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-4 h-4" /> <span className="font-medium text-xs">SENT</span>
                        </div>
                      ) : item.status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full w-fit">
                          <Clock className="w-4 h-4" /> <span className="font-medium text-xs">PENDING</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full w-fit">
                          <XCircle className="w-4 h-4" /> <span className="font-medium text-xs">FAILED</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-white">{item.to}</td>
                    <td className="px-4 py-4 text-slate-300">{item.subject}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {item.attempts}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 break-words whitespace-pre-wrap">
                      {item.error ? (
                        <span className="text-red-400/80 cursor-help" title={item.error}>
                          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                          {item.error}
                        </span>
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
