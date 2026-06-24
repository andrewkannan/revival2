'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginSpeaker } from '@/actions/breakout';
import { Lock, Loader2, Mic2 } from 'lucide-react';

export default function SpeakerLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await loginSpeaker(password);
    
    if (res.success) {
      router.refresh();
    } else {
      setError(res.message || 'Invalid password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b1013]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 border border-[#8caeb0]/20 bg-[#11181a]">
            <Mic2 className="w-8 h-8 text-[#8caeb0]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Speaker Q&A Access</h1>
          <p className="text-[#a4c5c6] mt-2">Enter the password to access the live questions dashboard</p>
        </div>

        <div className="bg-[#11181a] border border-[#8caeb0]/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/50">
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
                  className="block w-full pl-11 pr-4 py-3 bg-[#0b1013] border border-[#8caeb0]/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#8caeb0] transition-all"
                  placeholder="Enter speaker password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm font-bold text-[#0b1013] bg-[#8caeb0] hover:bg-[#a4c5c6] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
