'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function TranslatedFooter() {
  const { t } = useTranslation();

  return (
    <footer className="text-center pt-12 pb-8">
      <p className="text-slate-500 text-sm tracking-widest uppercase">{t('itineraryPage.footer')}</p>
    </footer>
  );
}
