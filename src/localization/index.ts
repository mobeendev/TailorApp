import en from './en.json';
import ur from './ur.json';
import type { Language, Labels } from '../domain/model';
export type Key = keyof typeof en;
export const languages: {
    code: Language;
    name: string;
    ready: boolean;
}[] = [{ code: 'ur', name: 'اردو', ready: true }, { code: 'en', name: 'English', ready: true }, { code: 'pa-Arab', name: 'پنجابی', ready: false }, { code: 'ps', name: 'پښتو', ready: false }, { code: 'sd', name: 'سنڌي', ready: false }, { code: 'ar', name: 'العربية', ready: false }];
export const rtl = (language: Language) => language !== 'en';
export function translate(language: Language, key: Key | string): string { return (language === 'ur' ? (ur as Record<string, string>)[key] : undefined) ?? (en as Record<string, string>)[key] ?? key; }
// Custom labels fall back from device language to English, then stable field key.
export function label(labels: Labels, language: Language, fallback = '') { return labels[language]?.trim() || labels.en || fallback; }

