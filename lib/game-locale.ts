export const languageOptions = {
  ko: '한국어',
  en: 'English',
  'zh-CN': '简体中文',
  ru: 'Русский',
  ja: '日本語',
} as const;

export type GameLocale = keyof typeof languageOptions;
export const defaultLocale: GameLocale = 'en';
const storageKey = 'physical-test:language';

export function isGameLocale(value: string | null): value is GameLocale {
  return value !== null && Object.prototype.hasOwnProperty.call(languageOptions, value);
}

export function detectLocale(preferences: readonly string[]): GameLocale {
  for (const preference of preferences) {
    const [language, ...subtags] = preference.toLowerCase().split(/[-_]/);
    if (language === 'zh') {
      if (!subtags.some((tag) => ['hant', 'tw', 'hk', 'mo'].includes(tag))) return 'zh-CN';
    } else if (isGameLocale(language)) {
      return language;
    }
  }
  return defaultLocale;
}

export function loadLocale(): GameLocale {
  try {
    const stored = localStorage.getItem(storageKey);
    if (isGameLocale(stored)) return stored;
  } catch {
    // The browser can restrict storage in private or embedded contexts.
  }
  return detectLocale(navigator.languages.length ? navigator.languages : [navigator.language]);
}

export function saveLocale(locale: GameLocale) {
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // The selected language still works for the current visit.
  }
}
