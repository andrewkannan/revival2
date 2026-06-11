'use client';

import { useState } from 'react';
import { submitTestimony, incrementTestimonyLike } from '@/actions/spiritual';
import { Loader2, MessageSquare, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

type Testimony = {
  id: string;
  content: string;
  likeCount: number;
  createdAt: Date;
};

export default function TestimonyBox({ initialTestimonies }: { initialTestimonies: Testimony[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [testimonies, setTestimonies] = useState<Testimony[]>(initialTestimonies);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    const res = await submitTestimony(formData);
    
    if (res.success) {
      setMessage(res.message || "Submitted!");
      setFormData({ content: '' });
    } else {
      setMessage(res.message || "Failed to submit.");
    }
    
    setIsSubmitting(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleLike = async (id: string) => {
    if (likedIds.has(id)) return; // Already liked this session

    // Optimistic UI update
    setLikedIds(new Set(likedIds).add(id));
    setTestimonies(prev => prev.map(t => t.id === id ? { ...t, likeCount: t.likeCount + 1 } : t));

    await incrementTestimonyLike(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <MessageSquare className="w-8 h-8 text-poster-accent" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white">Testimonies</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          What did God do in your life during this conference? 
          Share your story anonymously to encourage others!
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto hover:bg-white/[0.07] hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-poster-accent/5"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Story <span className="text-red-400">*</span></label>
            <textarea 
              required
              rows={5}
              placeholder="I experienced..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-poster-accent/50 transition-colors resize-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !formData.content.trim()}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Testimony'}
          </button>
          {message && (
            <p className={`text-center text-sm font-medium ${message.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </p>
          )}
        </form>
      </motion.div>

      {/* Live Testimony Feed */}
      {testimonies.length > 0 && (
        <div className="max-w-2xl mx-auto mt-16 space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <h3 className="text-lg font-medium text-slate-300 tracking-wider uppercase">Live Testimonies</h3>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          <div className="space-y-4">
            {testimonies.map((testimony, index) => (
              <motion.div 
                key={testimony.id} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-poster-accent/5 hover:border-white/20 relative overflow-hidden"
              >
                {/* Flash Effect on Praise */}
                {likedIds.has(testimony.id) && (
                  <motion.div
                    initial={{ opacity: 0.8, scale: 0.95 }}
                    animate={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 bg-poster-accent/40 shadow-[0_0_40px_rgba(140,174,176,0.4)] pointer-events-none rounded-2xl z-0"
                  />
                )}
                <p className="text-slate-200 leading-relaxed mb-4 text-sm md:text-base relative z-10">
                  "{testimony.content}"
                </p>
                <div className="flex items-center justify-end mt-auto pt-4 border-t border-white/5 relative z-10">
                  <button 
                    onClick={() => handleLike(testimony.id)}
                    disabled={likedIds.has(testimony.id)}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      likedIds.has(testimony.id) 
                        ? 'bg-poster-accent/20 text-poster-accent border border-poster-accent/40 shadow-[0_0_15px_rgba(140,174,176,0.3)]' 
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedIds.has(testimony.id) ? 'fill-current' : ''}`} />
                    <span>Praise ({testimony.likeCount})</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
