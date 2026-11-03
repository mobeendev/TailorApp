import type { Language } from './model.ts';

// Translate known built-in display values without changing historical stored values.
const garments: Record<string, string> = {
    'Shalwar Kameez': 'شلوار قمیض', 'Kameez Only': 'صرف قمیض',
    'Shalwar Only': 'صرف شلوار', Waistcoat: 'واسکٹ',
};
const options: Record<string, string> = { Simple: 'سادہ', Ban: 'بین', 'Shirt collar': 'شرٹ کالر' };
export function garmentName(value: string, language: Language) {
    return language === 'ur' ? garments[value] ?? value : value;
}
export function optionName(value: string, language: Language, fieldKey: string) {
    return language === 'ur' && ['collar', 'style'].includes(fieldKey) ? options[value] ?? value : value;
}
export function displayTimestamp(value: string, language: Language) {
    const formatted = new Date(value).toLocaleString(language === 'ur' ? 'ur-PK' : 'en-PK');
    return language === 'ur' ? formatted.replace(/\bAM\b/g, 'قبل دوپہر').replace(/\bPM\b/g, 'بعد دوپہر') : formatted;
}
