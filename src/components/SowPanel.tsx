'use client';

import { useState } from 'react';
import { submitSowing } from '@/actions/sowing';
import { Upload, CheckCircle2, Sprout, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SowPanel() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form Data
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your receipt.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const compressedBase64 = await compressImage(file);
      
      const res = await submitSowing({
        name,
        amount: parseFloat(amount),
        receiptUrl: compressedBase64
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || "Failed to submit.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setFile(null);
    setStep(1);
    setSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-[#1c272a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px] [-webkit-mask-image:-webkit-radial-gradient(white,black)]">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-poster-accent/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-poster-accent/20 to-poster-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-poster-accent/30 shadow-[0_0_30px_rgba(205,255,100,0.2)]">
            <Sprout className="w-8 h-8 text-poster-accent animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">Sow to the Ministry</h2>
          <p className="text-slate-400 mb-2">Partner with us in spreading the Gospel.</p>
          <p className="text-xs text-poster-accent/80 italic tracking-wide max-w-sm mx-auto">"Honor the Lord with your wealth, with the firstfruits of all your crops." - Proverbs 3:9</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Thank You for Your Generosity!</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                May the Lord bless you abundantly for your faithful sowing. Your giving empowers us to reach more lives for Jesus. 
                <br /><br />
                <span className="italic text-poster-accent/80">"And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work." - 2 Corinthians 9:8</span>
              </p>
              <button onClick={resetForm} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all hover:scale-105">
                Sow Again
              </button>
            </motion.div>
          ) : step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleNext} 
              className="space-y-6 relative z-10"
            >
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-poster-accent/50 focus:ring-1 focus:ring-poster-accent/50 transition-all" 
                  placeholder="e.g. Daniel" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Amount (RM)</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[20, 50, 100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(amount || "0");
                        setAmount((current + preset).toString());
                      }}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        amount === preset.toString()
                          ? 'bg-poster-accent/20 border-poster-accent text-poster-accent shadow-[0_0_15px_rgba(205,255,100,0.15)]'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      RM {preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">RM</span>
                  <input 
                    required 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number" 
                    step="0.01" 
                    min="1" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-poster-accent/50 focus:ring-1 focus:ring-poster-accent/50 transition-all font-mono text-lg" 
                    placeholder="Other Amount" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-poster-accent to-poster-accent-bright text-poster-bg font-bold py-4 rounded-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(205,255,100,0.3)] mt-8"
              >
                Continue to Payment
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} 
              className="space-y-6 relative z-10"
            >
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="text-center space-y-2 mb-2">
                <h3 className="text-xl font-bold text-white">Payment Instructions</h3>
                <p className="text-sm text-slate-400">Please transfer your sowing amount to the account below, then upload the receipt to confirm.</p>
              </div>

              <div className="bg-black/40 p-5 rounded-2xl border border-white/10 font-mono text-sm space-y-3 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="font-bold text-emerald-400 text-lg">RM {parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-slate-400">Bank</span>
                  <span className="font-bold text-white text-base">Maybank</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-slate-400">Account Name</span>
                  <span className="font-bold text-white text-base text-right">CALVARY COMMUNITY TT</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-slate-400">Account No.</span>
                  <span className="font-bold tracking-widest text-poster-accent-bright text-lg">551016737305</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reference</span>
                  <span className="font-bold tracking-widest text-poster-accent-bright">BIL CONF</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Upload Bank Receipt</label>
                <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${file ? 'border-poster-accent bg-poster-accent/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
                  <Upload className={`w-8 h-8 mb-3 ${file ? 'text-poster-accent' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-white mb-1">
                    {file ? file.name : 'Tap to upload receipt'}
                  </span>
                  <span className="text-xs text-slate-500">Image files only (JPG, PNG)</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      if (error) setError(null);
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-poster-accent text-poster-bg font-bold py-4 rounded-xl hover:bg-poster-accent-bright transition-all duration-300 disabled:opacity-70 flex items-center justify-center shadow-xl shadow-poster-accent/20"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</>
                  ) : 'Confirm & Submit'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
