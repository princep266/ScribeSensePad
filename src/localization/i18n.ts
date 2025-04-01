import { I18n, Scope, TranslateOptions } from 'i18n-js';
import * as enTranslations from './en.json';
import * as hiTranslations from './hi.json';
import { getLocales } from 'react-native-localize';

// Define supported locales
type SupportedLocales = 'en' | 'hi';

// Extend I18n type
interface CustomI18n extends I18n {
  t(scope: Scope, options?: TranslateOptions): string;
  locale: string;
  defaultLocale: string;
  enableFallback: boolean;
}

const i18n = new I18n({
  en: enTranslations,
  hi: hiTranslations
}) as CustomI18n;

// Configure i18n
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Get device language
const deviceLanguage = getLocales()[0].languageCode;

// Set initial locale based on device language
const initialLocale: SupportedLocales = deviceLanguage === 'hi' ? 'hi' : 'en';
i18n.locale = initialLocale;

export default i18n;
