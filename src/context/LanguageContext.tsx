'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'ta';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Load locale from localStorage on mount
    const savedLocale = localStorage.getItem('revival_locale') as Locale;
    if (savedLocale === 'en' || savedLocale === 'ta') {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('revival_locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
