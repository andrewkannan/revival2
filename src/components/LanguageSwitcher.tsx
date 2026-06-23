'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="absolute top-6 right-6 z-50 flex items-center bg-black/40 backdrop-blur-md rounded-full border border-white/20 p-1">
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all duration-300 ${
          locale === 'en'
            ? 'bg-poster-accent text-poster-bg shadow-[0_0_10px_rgba(140,174,176,0.5)]'
            : 'text-white/60 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('ta')}
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all duration-300 ${
          locale === 'ta'
            ? 'bg-poster-accent text-poster-bg shadow-[0_0_10px_rgba(140,174,176,0.5)]'
            : 'text-white/60 hover:text-white'
        }`}
      >
        TA
      </button>
    </div>
  );
}
