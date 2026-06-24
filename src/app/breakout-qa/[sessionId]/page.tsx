'use client';

import React, { useState, use } from 'react';
import { submitBreakoutQuestion } from '@/actions/breakout';
import { Send, Loader2, ArrowLeft, CheckCircle, MessageSquareQuote } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BreakoutQASubmission({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = parseInt(resolvedParams.sessionId, 10);
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
      setTimeout(() => setIsSuccess(false), 5000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1013] via-[#11181a] to-[#0b1013] text-white p-4 md:p-8 relative overflow-hidden flex items-center justify-center">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#8caeb0]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#cdff64]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <Link href="/itinerary" className="inline-flex items-center gap-2 text-[#8caeb0] hover:text-white mb-8 transition-colors group font-medium tracking-wide">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Itinerary
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden"
        >
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="mb-10 flex items-start gap-6">
            <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-gradient-to-br from-[#8caeb0]/20 to-transparent border border-[#8caeb0]/20 items-center justify-center flex-shrink-0">
              <MessageSquareQuote className="w-8 h-8 text-[#8caeb0]" />
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-[#cdff64]/10 border border-[#cdff64]/20 text-[#cdff64] rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                Live Q&A
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Ask the Speaker</h1>
              <p className="text-slate-400 font-light leading-relaxed">
                You are submitting a question for <strong className="text-white font-semibold">{sessionName}</strong>. 
                Keep it concise and relevant!
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 pl-1">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to ask anonymously"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#8caeb0] focus:ring-1 focus:ring-[#8caeb0]/50 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 pl-1">Your Question <span className="text-[#cdff64]">*</span></label>
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  placeholder="Type your question for the speaker here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#8caeb0] focus:ring-1 focus:ring-[#8caeb0]/50 transition-all placeholder:text-slate-600 resize-none font-medium peer"
                />
                <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-500 opacity-0 peer-focus:opacity-100 transition-opacity">
                  {content.length > 0 ? `${content.length} chars` : ''}
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-[#8caeb0] to-[#6b8b8d] text-[#0b1013] font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(140,174,176,0.3)] hover:shadow-[0_0_30px_rgba(140,174,176,0.5)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span className="tracking-wide uppercase text-sm">{isSubmitting ? 'Submitting...' : 'Send Question'}</span>
              </div>
            </button>

            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute inset-0 z-20 bg-[#11181a]/95 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Question Sent!</h3>
                <p className="text-slate-400 max-w-xs mb-8">Your question has been sent to the speaker's dashboard successfully.</p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="px-8 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors font-semibold"
                >
                  Ask Another Question
                </button>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
