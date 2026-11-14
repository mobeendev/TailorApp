
export type ThemeName = 'heritage' | 'indigo' | 'rose';
/** Theme colors. Text tokens (ink, muted, label) keep at least 4.5:1 contrast on `bg` and `card`. */
export type Palette = {
    /** Header and brand surfaces. */
    navy: string;
    /** Primary actions, links and selected states. White text on it is at least 4.5:1. */
    green: string;
    /** Main text. */
    ink: string;
    /** Secondary text. */
    muted: string;
    /** Form labels. */
    label: string;
    /** Icons, chevrons and placeholders (at least 3:1 on white). */
    faint: string;
    /** App background behind cards. */
    bg: string;
    /** Card and sheet surface. */
    card: string;
    /** Borders and dividers. */
    line: string;
    /** Soft tint of the primary color for icon wells and selected rows. */
    mint: string;
    /** Area outside the centered column on wide screens. */
    outer: string;
    /** Input background. */
    input: string;
    /** Decorative brand accent. */
    gold: string;
    /** Secondary text on the header. */
    headerMuted: string;
};
export const palettes: Record<ThemeName, Palette> = {
    heritage: { navy: '#0F3B33', green: '#0A7255', ink: '#16241E', muted: '#4F5E57', label: '#34443D', faint: '#7D8A84', bg: '#F5F2EB', card: '#FFFFFF', line: '#E2DCD0', mint: '#E3F1EA', outer: '#E6E1D6', input: '#FFFFFF', gold: '#C79A45', headerMuted: '#B9D3C8' },
    indigo: { navy: '#1E2F55', green: '#2D53A8', ink: '#17213A', muted: '#525E75', label: '#2F3A52', faint: '#7A8499', bg: '#F2F4F9', card: '#FFFFFF', line: '#DCE2EE', mint: '#E6EDFA', outer: '#E0E5EF', input: '#FFFFFF', gold: '#C79A45', headerMuted: '#BCC8E3' },
    rose: { navy: '#552A39', green: '#9E3559', ink: '#3A1F28', muted: '#6F5A62', label: '#4A3239', faint: '#93808A', bg: '#FAF4F3', card: '#FFFFFF', line: '#EBDDDD', mint: '#F7E6EB', outer: '#EEE2E1', input: '#FFFFFF', gold: '#C79A45', headerMuted: '#E6C9D3' },
};
export type Tone = 'info' | 'warning' | 'success' | 'danger' | 'neutral';
/** Meaning colors shared by every theme. Each `fg` keeps at least 4.5:1 contrast on its `bg` and on white. */
export const tones: Record<Tone, { fg: string; bg: string }> = {
    info: { fg: '#1D5BAA', bg: '#E7F0FC' },
    warning: { fg: '#8A5300', bg: '#FDF1D8' },
    success: { fg: '#11734A', bg: '#E2F4EA' },
    danger: { fg: '#B42318', bg: '#FDECEA' },
    neutral: { fg: '#4A5568', bg: '#EDF0F3' },
};
export function normalizeTheme(theme: unknown): ThemeName { return theme === 'indigo' || theme === 'rose' ? theme : 'heritage'; }
export function getPalette(theme: unknown): Palette { return palettes[normalizeTheme(theme)]; }
