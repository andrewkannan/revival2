'use client';

import { useState, useEffect } from 'react';
import { getBreakoutQuestions, markBreakoutQuestionDone } from '@/actions/breakout';
import { Loader2, CheckCircle, RefreshCw, User, MessageSquare } from 'lucide-react';

export default function SpeakerDashboard() {
  const [activeSession, setActiveSession] = useState<number>(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuestions = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    const res = await getBreakoutQuestions(activeSession);
    if (res.success) {
      setQuestions(res.questions || []);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchQuestions();
    
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchQuestions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleMarkDone = async (id: string) => {
    // Optimistic update
    setQuestions(questions.map(q => q.id === id ? { ...q, isDone: true } : q));
    await markBreakoutQuestionDone(id, true);
  };

  const handleUndoDone = async (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, isDone: false } : q));
    await markBreakoutQuestionDone(id, false);
  };

  const pendingQuestions = questions.filter(q => !q.isDone);
  const doneQuestions = questions.filter(q => q.isDone);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Live Q&A Dashboard</h1>
          <p className="text-slate-400">View and manage incoming questions from attendees in real-time.</p>
        </div>

        <div className="flex bg-[#11181a] p-1.5 rounded-2xl border border-[#233135]">
          <button
            onClick={() => setActiveSession(1)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSession === 1 ? 'bg-[#8caeb0] text-[#0b1013] shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Auditorium 2
          </button>
          <button
            onClick={() => setActiveSession(2)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSession === 2 ? 'bg-[#8caeb0] text-[#0b1013] shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Auditorium 3
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          New Questions <span className="bg-[#cdff64] text-[#0b1013] px-2.5 py-0.5 rounded-full text-sm">{pendingQuestions.length}</span>
        </h2>
        <button 
          onClick={() => fetchQuestions(true)}
          className={`text-slate-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 mb-16">
          {pendingQuestions.length === 0 ? (
            <div className="bg-[#11181a] border border-[#233135] border-dashed rounded-3xl p-12 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No new questions yet.</p>
            </div>
          ) : (
            pendingQuestions.map((q) => (
              <div key={q.id} className="bg-[#11181a] border border-[#8caeb0]/30 rounded-2xl p-6 shadow-lg shadow-[#8caeb0]/5 transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-[#8caeb0] font-bold tracking-widest uppercase mb-3">
                      <User className="w-4 h-4" />
                      {q.authorName || 'Anonymous'}
                    </div>
                    <p className="text-xl md:text-2xl text-white leading-relaxed font-medium">{q.content}</p>
                  </div>
                  <button
                    onClick={() => handleMarkDone(q.id)}
                    className="shrink-0 flex items-center gap-2 px-5 py-3 bg-[#cdff64]/10 hover:bg-[#cdff64]/20 text-[#cdff64] border border-[#cdff64]/30 rounded-xl font-bold transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Mark Done</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {doneQuestions.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-slate-400 mb-6 flex items-center gap-2">
            Answered
          </h2>
          <div className="space-y-4 opacity-60">
            {doneQuestions.map((q) => (
              <div key={q.id} className="bg-[#0b1013] border border-[#233135] rounded-2xl p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-bold tracking-widest uppercase mb-2">
                      <User className="w-4 h-4" />
                      {q.authorName || 'Anonymous'}
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed">{q.content}</p>
                  </div>
                  <button
                    onClick={() => handleUndoDone(q.id)}
                    className="shrink-0 text-sm text-slate-500 hover:text-slate-300 font-medium underline"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
