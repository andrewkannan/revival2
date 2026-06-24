'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginScanner } from '@/actions/admin';
import { Lock, Loader2, QrCode } from 'lucide-react';

export default function ScannerLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await loginScanner(password);
    
    if (res.success) {
      router.push('/scanner');
      router.refresh();
    } else {
      setError(res.message || 'Invalid password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-poster-accent/10 mb-6 border border-poster-accent/20">
            <QrCode className="w-8 h-8 text-poster-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Scanner Access</h1>
          <p className="text-slate-400 mt-2">Enter the password to access the check-in scanner</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-poster-accent/50 focus:border-poster-accent/50 transition-all"
                  placeholder="Enter scanner password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-poster-accent hover:bg-poster-accent-bright focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poster-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Access Scanner'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
