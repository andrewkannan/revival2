'use client';

import React, { useState } from 'react';
import { submitBreakoutQuestion } from '@/actions/breakout';
import { Send, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BreakoutQASubmission({ params }: { params: { sessionId: string } }) {
  const sessionId = parseInt(params.sessionId, 10);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionName = sessionId === 1 ? 'Auditorium 2: Revival in Marketplace' : 'Auditorium 3: Hosting the Glory';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await submitBreakoutQuestion(sessionId, content, authorName);
    
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setContent('');
      setAuthorName('');
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1013] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto mt-4">
        <Link href="/itinerary" className="inline-flex items-center gap-2 text-[#8caeb0] hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Itinerary
        </Link>
        
        <div className="bg-[#11181a] border border-[#233135] rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-[#8caeb0]/10 border border-[#8caeb0]/20 text-[#8caeb0] rounded-full text-xs font-bold tracking-widest uppercase mb-4">
              Live Q&A
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Ask a Question</h1>
            <p className="text-slate-400">You are submitting a question for <strong className="text-white">{sessionName}</strong>.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to ask anonymously"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8caeb0] transition-colors placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Question *</label>
              <textarea
                required
                rows={4}
                placeholder="Type your question for the speaker here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8caeb0] transition-colors placeholder:text-slate-600 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#8caeb0] hover:bg-[#a4c5c6] text-[#0b1013] font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? 'Submitting...' : 'Submit Question'}
            </button>

            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium mt-4 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-5 h-5" />
                Question submitted successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
