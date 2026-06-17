'use client';

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface CountdownLockProps {
  children: React.ReactNode;
  unlockTime?: string;
  title?: string;
  isLocked?: boolean;
}

export default function CountdownLock({ 
  children, 
  unlockTime = '2026-06-26T12:00:00+08:00',
  title = "Unlocks in",
  isLocked: externalIsLocked = true
}: CountdownLockProps) {
  const [isLocked, setIsLocked] = useState(externalIsLocked);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!externalIsLocked) {
      setIsLocked(false);
      return;
    }

    const targetDate = new Date(unlockTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsLocked(false);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsLocked(true);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [unlockTime, externalIsLocked]);

  if (!mounted) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
      </div>
    );
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {/* Blurred background content */}
      <div className="opacity-20 pointer-events-none blur-md select-none transition-all duration-500 overflow-hidden">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 mt-16">
        <div className="bg-[#1c272a]/90 backdrop-blur-xl border border-poster-accent/30 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center max-w-lg w-full text-center transform transition-transform hover:scale-105 duration-500">
          <div className="w-16 h-16 bg-poster-accent/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-poster-accent" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">{title}</h3>
          <p className="text-slate-400 mb-8 text-sm max-w-sm">
            This section is currently locked. It will become available as we get closer to REVIVAL.
          </p>
          
          <div className="flex gap-4 md:gap-6 justify-center">
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-5xl font-black text-poster-accent drop-shadow-[0_0_15px_rgba(205,255,100,0.5)] w-16 md:w-20">
                {timeLeft.days.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-2">Days</div>
            </div>
            <div className="text-3xl md:text-5xl font-black text-poster-accent/50 pb-2">:</div>
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-5xl font-black text-poster-accent drop-shadow-[0_0_15px_rgba(205,255,100,0.5)] w-16 md:w-20">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-2">Hours</div>
            </div>
            <div className="text-3xl md:text-5xl font-black text-poster-accent/50 pb-2">:</div>
            <div className="flex flex-col items-center">
              <div className="text-3xl md:text-5xl font-black text-poster-accent drop-shadow-[0_0_15px_rgba(205,255,100,0.5)] w-16 md:w-20">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-2">Mins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
