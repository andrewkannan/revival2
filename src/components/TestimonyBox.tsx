'use client';

import { useState } from 'react';
import { submitTestimony } from '@/actions/spiritual';
import { Loader2, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export default function TestimonyBox() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    authorName: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSubmitting(true);

    const res = await submitTestimony(formData);
    
    if (res.success) {
      setSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({ authorName: '', content: '' });
    setSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-[#1c272a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px] [-webkit-mask-image:-webkit-radial-gradient(white,black)]">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-poster-accent/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-poster-accent/20 to-poster-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-poster-accent/30 shadow-[0_0_30px_rgba(205,255,100,0.2)]">
            <MessageSquare className="w-8 h-8 text-poster-accent animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">{t('testimonyBox.title')}</h2>
          <p className="text-slate-400 mb-2">{t('testimonyBox.subtitle')}</p>
          <p className="text-xs text-poster-accent/80 italic tracking-wide max-w-sm mx-auto">{t('testimonyBox.verse')}</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 relative z-10"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t('testimonyBox.successTitle')}</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                {t('testimonyBox.successDesc')}
              </p>
              <button onClick={resetForm} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all hover:scale-105">
                {t('testimonyBox.shareAnother')}
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit} 
              className="space-y-6 relative z-10"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('testimonyBox.nameLabel')}</label>
                <input 
                  type="text" 
                  value={formData.authorName}
                  onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-poster-accent/50 focus:ring-1 focus:ring-poster-accent/50 transition-all" 
                  placeholder={t('testimonyBox.namePlaceholder')} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('testimonyBox.contentLabel')} <span className="text-red-400">*</span></label>
                <textarea 
                  required 
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-poster-accent/50 focus:ring-1 focus:ring-poster-accent/50 transition-all resize-none" 
                  placeholder={t('testimonyBox.contentPlaceholder')} 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !formData.content.trim()}
                className="w-full bg-gradient-to-r from-poster-accent to-poster-accent-bright text-poster-bg font-bold py-4 rounded-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(205,255,100,0.3)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('testimonyBox.sendBtn')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
