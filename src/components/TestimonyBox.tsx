'use client';

import { useState } from 'react';
import { submitTestimony } from '@/actions/spiritual';
import { Loader2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestimonyBox() {
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

    const res = await submitTestimony(formData);
    
    if (res.success) {
      setMessage(res.message || "Submitted!");
      setFormData({ authorName: '', content: '' });
    } else {
      setMessage(res.message || "Failed to submit.");
    }
    
    setIsSubmitting(false);
    setTimeout(() => setMessage(''), 5000);
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
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white">Share Your Testimony</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          What did God do in your life during this conference? 
          Share your story to encourage others and the ministry team!
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name (Optional)</label>
            <input 
              type="text" 
              placeholder="Anonymous"
              value={formData.authorName}
              onChange={e => setFormData({ ...formData, authorName: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-poster-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Story <span className="text-red-400">*</span></label>
            <textarea 
              required
              rows={6}
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
    </div>
  );
}
