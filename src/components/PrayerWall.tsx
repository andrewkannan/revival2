'use client';

import { useState } from 'react';
import { submitPrayerRequest, incrementPrayerCount } from '@/actions/spiritual';
import { Heart, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Prayer {
  id: string;
  authorName: string | null;
  content: string;
  prayCount: number;
  createdAt: Date;
}

export default function PrayerWall({ initialPrayers }: { initialPrayers: Prayer[] }) {
  const [prayers, setPrayers] = useState<Prayer[]>(initialPrayers);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    authorName: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    const res = await submitPrayerRequest(formData);
    
    if (res.success) {
      setMessage(res.message || "Submitted!");
      setFormData({ authorName: '', content: '' });
    } else {
      setMessage(res.message || "Failed to submit.");
    }
    
    setIsSubmitting(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePray = async (id: string) => {
    if (prayedIds.has(id)) return;

    // Optimistic update
    setPrayedIds(new Set(prayedIds).add(id));
    setPrayers(current => 
      current.map(p => p.id === id ? { ...p, prayCount: p.prayCount + 1 } : p)
    );
    await incrementPrayerCount(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-poster-accent">Prayer Wall</h2>
        <p className="text-slate-400">Post a prayer request and stand in faith with others.</p>
      </motion.div>

      {/* Submission Form */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-poster-accent/5"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name (Optional)</label>
            <input 
              type="text"
              placeholder="Your Name (Optional)"
              value={formData.authorName}
              onChange={e => setFormData({ ...formData, authorName: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors mb-4"
            />
            
            <label className="block text-sm font-medium text-slate-300 mb-2">Prayer Request <span className="text-red-400">*</span></label>
            <textarea 
              required
              rows={4}
              placeholder="How can we pray for you today?"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !formData.content.trim()}
            className="w-full bg-poster-accent text-black font-bold py-3 rounded-xl hover:bg-poster-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
          </button>
          {message && (
            <p className="text-center text-sm text-emerald-400 font-medium">{message}</p>
          )}
        </form>
      </motion.div>

      {/* Feed */}
      <div className="space-y-4">
        {prayers.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            No prayer requests yet. Be the first to post!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prayers.map((prayer, index) => (
              <motion.div 
                key={prayer.id} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-poster-accent/5 hover:border-white/20 relative overflow-hidden"
              >
                {/* Flash Effect on Pray */}
                {prayedIds.has(prayer.id) && (
                  <motion.div
                    initial={{ opacity: 0.8, scale: 0.95 }}
                    animate={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 bg-poster-accent/40 shadow-[0_0_40px_rgba(140,174,176,0.4)] pointer-events-none rounded-2xl z-0"
                  />
                )}
                {/* Author Header */}
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-poster-accent/10 flex items-center justify-center border border-poster-accent/20">
                    <User className="w-5 h-5 text-poster-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{prayer.authorName || "Conference Attendee"}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(prayer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <p className="text-slate-200 leading-relaxed mb-4 text-[15px] relative z-10">
                  {prayer.content}
                </p>

                {/* Footer Action */}
                <div className="flex items-center mt-2 relative z-10">
                  <button 
                    onClick={() => handlePray(prayer.id)}
                    disabled={prayedIds.has(prayer.id)}
                    className={`flex items-center gap-1.5 group transition-colors duration-300 ${
                      prayedIds.has(prayer.id) 
                        ? 'text-poster-accent' 
                        : 'text-slate-400 hover:text-poster-accent'
                    }`}
                  >
                    <div className={`p-2 rounded-full transition-all duration-300 ${
                      prayedIds.has(prayer.id) ? 'bg-poster-accent/20' : 'group-hover:bg-poster-accent/10'
                    }`}>
                      <Heart className={`w-4 h-4 transition-transform duration-300 ${
                        prayedIds.has(prayer.id) ? 'fill-current scale-110' : 'group-hover:scale-110'
                      }`} />
                    </div>
                    <span className="text-sm font-medium">
                      Praying {prayer.prayCount > 0 && `(${prayer.prayCount})`}
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
