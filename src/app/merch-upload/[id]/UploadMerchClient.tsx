'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadMerchReceipt } from '@/actions/merchandise';
import { useRouter } from 'next/navigation';

export default function UploadMerchClient({ 
  orderId, 
  totalAmount, 
  orderNumber 
}: { 
  orderId: string; 
  totalAmount: number;
  orderNumber: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
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

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const form = e.currentTarget;
      const fileInput = form.elements.namedItem('receipt') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (!file) {
        setError("Please select a file to upload.");
        setLoading(false);
        return;
      }

      const compressedBase64 = await compressImage(file);
      
      const formData = new FormData();
      formData.append('receiptBase64', compressedBase64);

      const res = await uploadMerchReceipt(orderId, formData);

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to upload receipt.');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-poster-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-poster-accent-bright" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Receipt Uploaded!</h3>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          Thank you! We have received your payment receipt for Order #{orderNumber}. Our team will verify it shortly and contact you when your merchandise is ready for collection.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold mb-6">Upload Payment Receipt</h2>
      
      <p className="text-slate-300 text-sm mb-4">
        Please transfer the total amount of <strong className="text-white text-lg font-mono">RM {totalAmount.toFixed(2)}</strong> to the bank account below.
      </p>
      
      <div className="bg-black/60 p-4 rounded-xl border border-white/10 mb-8 font-mono text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Bank Name</span>
          <span className="font-medium text-white">Maybank</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Account Name</span>
          <span className="font-medium text-white">CALVARY COMMUNITY TT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Account Number</span>
          <span className="font-medium tracking-widest text-poster-accent-bright">551016737305</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
          <span className="text-slate-400">Payment Reference</span>
          <span className="font-bold text-white tracking-wider">{orderNumber}</span>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Select Image File</label>
          <div className="relative">
            <input 
              type="file" 
              name="receipt" 
              accept="image/*" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
            />
          </div>
        </div>

        {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-poster-accent hover:bg-poster-accent-bright text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(205,255,100,0.3)] disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {loading ? 'Uploading...' : 'Submit Receipt'}
        </button>
      </form>
    </div>
  );
}
