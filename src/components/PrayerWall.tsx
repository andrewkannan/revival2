'use client';

import { useState } from 'react';
import { submitPrayerRequest, incrementPrayerCount } from '@/actions/spiritual';
import { Heart, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
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
      setFormData({ content: '' });
    } else {
      setMessage(res.message || "Failed to submit.");
    }
    
    setIsSubmitting(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePray = async (id: string) => {
    // Optimistic update
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
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-poster-accent">Live Prayer Wall</h2>
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
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post to Prayer Wall'}
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
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-poster-accent/5 hover:border-white/20"
              >
                <div className="flex-grow space-y-3">
                  <p className="text-slate-200 leading-relaxed">{prayer.content}</p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-slate-500">
                    {new Date(prayer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    onClick={() => handlePray(prayer.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    <Heart className="w-4 h-4" /> 
                    <span className="text-sm font-medium">{prayer.prayCount} Praying</span>
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
