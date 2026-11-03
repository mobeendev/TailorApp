export type ThemeName = 'heritage' | 'indigo' | 'rose';
export type Palette = {
    navy: string;
    green: string;
    ink: string;
    muted: string;
    bg: string;
    line: string;
    mint: string;
    blue: string;
    outer: string;
    input: string;
};
export const palettes: Record<ThemeName, Palette> = {
    heritage: { navy: '#173F39', green: '#087D59', ink: '#263E35', muted: '#5C6C62', bg: '#F8F5EF', line: '#E7E0D4', mint: '#EEF3E8', blue: '#176D9C', outer: '#E8E4DA', input: '#FCFAF5' },
    indigo: { navy: '#283B5C', green: '#315BB0', ink: '#263851', muted: '#6F7B8B', bg: '#F2F5FA', line: '#DBE2EE', mint: '#E9EFF9', blue: '#687BA5', outer: '#E1E6EF', input: '#F8FAFD' },
    rose: { navy: '#623C48', green: '#A53F62', ink: '#4E303B', muted: '#857078', bg: '#FBF4F2', line: '#ECDDDC', mint: '#F6E8E9', blue: '#A27E87', outer: '#ECE0DF', input: '#FFFAF8' }
};
export function normalizeTheme(theme: unknown): ThemeName { return theme === 'indigo' || theme === 'rose' ? theme : 'heritage'; }
export function getPalette(theme: unknown): Palette { return palettes[normalizeTheme(theme)]; }

