'use client';

import React, { useState, useTransition } from 'react';
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Search, Pause, Play, Loader2, ArrowUpCircle } from 'lucide-react';
import { toggleEmailQueue, retryAllFailedEmails, prioritizeEmailInQueue } from '@/actions/admin';
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
  const [showSent, setShowSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleTogglePause = () => {
    startTransition(async () => {
      await toggleEmailQueue(!initialPaused);
      router.refresh();
    });
  };

  const handleRetryFailed = () => {
    if (confirm("Are you sure you want to re-queue all failed emails?")) {
      startTransition(async () => {
        const res = await retryAllFailedEmails();
        if (res.success) {
          alert(`Successfully re-queued ${res.count} emails.`);
          router.refresh();
        } else {
          alert(`Failed: ${res.message}`);
        }
      });
    }
  };

  const handlePrioritize = (id: string) => {
    startTransition(async () => {
      const res = await prioritizeEmailInQueue(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(`Failed: ${res.message}`);
      }
    });
  };

  const filteredQueue = initialQueue.filter((item) => {
    if (!showSent && item.status === 'SENT') return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.to && item.to.toLowerCase().includes(searchLower)) ||
      (item.subject && item.subject.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    // PENDING goes first. Then sort PENDING by createdAt ASC.
    // FAILED and SENT sort by createdAt DESC.
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
    
    if (a.status === 'PENDING' && b.status === 'PENDING') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
        
        <div className="flex items-center gap-2 mr-auto sm:mr-0 text-sm text-slate-300">
          <input 
            type="checkbox" 
            id="showSent" 
            checked={showSent} 
            onChange={(e) => setShowSent(e.target.checked)} 
            className="rounded border-white/20 bg-white/5 text-poster-accent focus:ring-poster-accent"
          />
          <label htmlFor="showSent" className="cursor-pointer select-none">Show Sent</label>
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
          <button
            onClick={handleRetryFailed}
            disabled={isPending || initialQueue.filter(q => q.status === 'FAILED').length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Retry All Failed
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
                <th className="px-4 py-4 font-medium text-right">Actions</th>
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
                      {new Date(item.createdAt).getTime() === 0 ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                          Priority (Next in line)
                        </span>
                      ) : (
                        new Date(item.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Singapore', dateStyle: 'short', timeStyle: 'medium' })
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {item.sentAt ? new Date(item.sentAt).toLocaleString('en-US', { timeZone: 'Asia/Singapore', dateStyle: 'short', timeStyle: 'medium' }) : '-'}
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
                    <td className="px-4 py-4 text-right">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => handlePrioritize(item.id)}
                          disabled={isPending || new Date(item.createdAt).getTime() === 0}
                          title="Prioritize (Move to top of queue)"
                          className="p-2 text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
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
