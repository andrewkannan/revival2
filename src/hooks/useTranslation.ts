import { useLanguage } from '../context/LanguageContext';
import { en } from '../i18n/en';
import { ta } from '../i18n/ta';

const dictionaries = { en, ta };

type Dictionary = typeof en;

export const useTranslation = () => {
  const { locale } = useLanguage();
  const dictionary = dictionaries[locale] as Dictionary;

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = dictionary;

    for (const k of keys) {
      if (result[k] === undefined) {
        // Fallback to English if translation is missing
        let fallbackResult: any = en;
        for (const fbK of keys) {
          if (fallbackResult[fbK] === undefined) return key;
          fallbackResult = fallbackResult[fbK];
        }
        return fallbackResult;
      }
      result = result[k];
    }

    return result as string;
  };

  return { t, locale };
};
