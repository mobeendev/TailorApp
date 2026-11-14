import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type KeyboardTypeOptions } from 'react-native';
import { Text, TextInput, lineHeightFor } from './AppText';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleX, ClipboardList, FlaskConical, House, Info, PackageCheck, Ruler, Scissors, Search, Settings, Sparkles, Users, X, type LucideIcon } from 'lucide-react-native';
import { useI18n, useShop, useStore, usePalette } from '../store';
import { rtl } from '../localization';
import { BrandEmblem } from './Brand';
import { isWalkthrough } from '../database/mode';
import { tones, type Palette, type Tone } from '../domain/themes';
import { formatMoney } from '../domain/validation';
export const useColors = usePalette;
export { tones };
const createStyles = (colors: Palette) => StyleSheet.create({
    card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 12, boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06)' },
    title: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, lineHeight: 29 },
    heading: { fontSize: 18, fontWeight: '700', color: colors.ink, lineHeight: 25 },
    text: { fontSize: 16, color: colors.ink, lineHeight: 24 },
    strong: { fontSize: 16, fontWeight: '600', color: colors.ink, lineHeight: 23 },
    muted: { fontSize: 14, color: colors.muted, lineHeight: 21 },
    label: { fontSize: 14, fontWeight: '600', color: colors.label, lineHeight: 20 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
    input: { backgroundColor: colors.input, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, fontSize: 16, color: colors.ink, minHeight: 52 },
    error: { color: tones.danger.fg, fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
export function useStyles() { return createStyles(useColors()); }
/** Text in the app's type scale, aligned for the reading direction. */
export function Txt({ children, muted = false, title = false, heading = false, strong = false, center = false, color, lines }: {
    children: React.ReactNode;
    muted?: boolean;
    title?: boolean;
    heading?: boolean;
    strong?: boolean;
    center?: boolean;
    color?: string;
    lines?: number;
}) {
    const styles = useStyles();
    const { device } = useStore();
    const isRtl = rtl(device.language);
    return <Text numberOfLines={lines} style={[title ? styles.title : heading ? styles.heading : muted ? styles.muted : strong ? styles.strong : styles.text, color ? { color } : null, { textAlign: center ? 'center' : isRtl ? 'right' : 'left' }]}>{children}</Text>;
}
/** Chevron that points forward in the reading direction. */
export function Chevron({ size = 18, color }: { size?: number; color?: string }) {
    const colors = useColors(); const { device } = useStore();
    const Icon = rtl(device.language) ? ChevronLeft : ChevronRight;
    return <Icon size={size} color={color ?? colors.faint} strokeWidth={2}/>;
}
/** An icon on a soft tinted tile. */
export function IconWell({ icon: Icon, color, bg, size = 44, round = false }: {
    icon: LucideIcon;
    color?: string;
    bg?: string;
    size?: number;
    round?: boolean;
}) {
    const colors = useColors();
    return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.3), backgroundColor: bg ?? colors.mint, alignItems: 'center', justifyContent: 'center' }}><Icon size={Math.round(size * 0.5)} color={color ?? colors.green} strokeWidth={2}/></View>;
}
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'destructive';
export function Button({ title, onPress, secondary = false, tone, disabled = false, icon: Icon, compact = false }: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    /** primary (filled), secondary (outlined), danger (soft red) or destructive (filled red). */
    tone?: ButtonTone;
    disabled?: boolean;
    icon?: LucideIcon;
    compact?: boolean;
}) {
    const colors = useColors();
    const { busy, device } = useStore();
    const kind = tone ?? (secondary ? 'secondary' : 'primary');
    const look = kind === 'primary' ? { bg: colors.green, border: colors.green, fg: '#FFFFFF' }
        : kind === 'destructive' ? { bg: tones.danger.fg, border: tones.danger.fg, fg: '#FFFFFF' }
            : kind === 'danger' ? { bg: tones.danger.bg, border: tones.danger.bg, fg: tones.danger.fg }
                : { bg: colors.card, border: colors.line, fg: colors.green };
    const off = disabled || busy;
    return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: off }} disabled={off} onPress={onPress} style={({ pressed }) => ({ minHeight: compact ? 44 : 52, borderRadius: 14, paddingHorizontal: compact ? 14 : 18, paddingVertical: compact ? 8 : 10, gap: 10, flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: look.border, backgroundColor: pressed && kind === 'secondary' ? colors.mint : look.bg, opacity: off ? 0.45 : pressed && kind !== 'secondary' ? 0.85 : 1 })}>
    {Icon && <Icon size={compact ? 18 : 20} color={look.fg} strokeWidth={2.2}/>}<Text style={{ fontSize: compact ? 15 : 16, fontWeight: '600', lineHeight: 21, textAlign: 'center', flexShrink: 1, color: look.fg }}>{title}</Text>
  </Pressable>;
}
/** Square icon-only button. `label` is announced to screen readers. */
export function IconButton({ icon: Icon, label, onPress, disabled = false, tone }: {
    icon: LucideIcon;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    tone?: 'danger';
}) {
    const colors = useColors();
    const { busy } = useStore();
    const off = disabled || busy;
    const fg = tone === 'danger' ? tones.danger.fg : colors.green;
    return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: off }} disabled={off} onPress={onPress} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: tone === 'danger' ? tones.danger.bg : colors.line, backgroundColor: tone === 'danger' ? tones.danger.bg : pressed ? colors.mint : colors.card, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.4 : pressed ? 0.8 : 1 })}><Icon size={20} color={fg} strokeWidth={2.2}/></Pressable>;
}
export function Card({ children, compact = false }: {
    children: React.ReactNode;
    compact?: boolean;
}) { const styles = useStyles(); return <View style={[styles.card, compact && { padding: 14, gap: 10 }]}>{children}</View>; }
export function Pair({ children }: { children: React.ReactNode }) {
    const { device } = useStore();
    // toArray drops false/null children, so a conditional second button lets the first fill the row.
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', gap: 10, alignItems: 'stretch' }}>{React.Children.toArray(children).map((child, index) => <View key={index} style={{ flex: 1, minWidth: 0 }}>{child}</View>)}</View>;
}
export function Row({ children }: {
    children: React.ReactNode;
}) { const styles = useStyles(); const { device } = useStore(); return <View style={[styles.row, { flexDirection: rtl(device.language) ? 'row-reverse' : 'row' }]}>{children}</View>; }
export function Divider() { const colors = useColors(); return <View style={{ height: 1, backgroundColor: colors.line }}/>; }
/** Field label. `lines` reserves equal height so inputs in one grid row line up when a label wraps. */
export function FieldLabel({ children, lines }: { children: React.ReactNode; lines?: number }) {
    const styles = useStyles();
    const { device } = useStore();
    const align = { textAlign: rtl(device.language) ? 'right' as const : 'left' as const };
    if (!lines) return <Text style={[styles.label, align]}>{children}</Text>;
    // Grid labels are a step smaller so three columns fit on a phone. They sit at the bottom of the
    // reserved space, so a one-line label stays right above its input.
    return <View style={{ minHeight: lines * lineHeightFor(13, device.language, 18), justifyContent: 'flex-end' }}><Text numberOfLines={lines} style={[styles.label, align, { fontSize: 13, lineHeight: 18 }]}>{children}</Text></View>;
}
export function FieldError({ children }: { children: React.ReactNode }) {
    const styles = useStyles();
    const { device } = useStore();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', gap: 6, alignItems: 'center' }}><CircleAlert size={16} color={tones.danger.fg} strokeWidth={2.2}/><Text accessibilityRole="alert" style={[styles.error, { flexShrink: 1, textAlign: rtl(device.language) ? 'right' : 'left' }]}>{children}</Text></View>;
}
export function Input({ label, value, onChange, numeric = false, multiline = false, error, placeholder, labelLines, secure = false, keyboardType, autoCapitalize }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    numeric?: boolean;
    multiline?: boolean;
    error?: string;
    placeholder?: string;
    /** Reserve this many label lines so inputs in a grid row line up even when one label wraps. */
    labelLines?: number;
    secure?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
    const styles = useStyles();
    const colors = useColors();
    const { device } = useStore();
    const [focused, setFocused] = useState(false);
    return <View style={{ gap: 6 }}><FieldLabel lines={labelLines}>{label}</FieldLabel><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} keyboardType={keyboardType ?? (numeric ? 'decimal-pad' : 'default')} autoCapitalize={autoCapitalize} secureTextEntry={secure} multiline={multiline} placeholder={placeholder} placeholderTextColor={colors.faint} underlineColorAndroid="transparent" style={[styles.input, { borderColor: error ? tones.danger.fg : focused ? colors.green : colors.line, textAlign: rtl(device.language) ? 'right' : 'left', ...(multiline ? { minHeight: 96, textAlignVertical: 'top' as const } : {}) }]}/>{error && <FieldError>{error}</FieldError>}</View>;
}
export function SearchInput({ label, value, onChange, autoFocus = false }: {
    autoFocus?: boolean;
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const colors = useColors();
    const { device } = useStore();
    const t = useI18n();
    const [focused, setFocused] = useState(false);
    const isRtl = rtl(device.language);
    return <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: focused ? colors.green : colors.line, minHeight: 52 }}>
    <Search size={20} color={colors.muted} strokeWidth={2.2}/>
    <TextInput autoFocus={autoFocus} accessibilityLabel={label} placeholder={label} placeholderTextColor={colors.faint} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} underlineColorAndroid="transparent" style={{ flex: 1, minHeight: 50, color: colors.ink, fontSize: 16, textAlign: isRtl ? 'right' : 'left' }}/>
    {Boolean(value) && <Pressable accessibilityRole="button" accessibilityLabel={t('clearSearch')} hitSlop={12} onPress={() => onChange('')} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}><X size={16} color={colors.ink} strokeWidth={2.4}/></Pressable>}
  </View>;
}
/** Single-choice chips. */
export function Choice({ options, value, onChange }: {
    options: {
        value: string;
        label: string;
    }[];
    value: string;
    onChange: (v: string) => void;
}) {
    const colors = useColors();
    const { device } = useStore();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>{options.map(o => { const on = value === o.value; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} key={o.value} onPress={() => onChange(o.value)} style={({ pressed }) => ({ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: on ? colors.green : colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: on ? colors.green : pressed ? colors.mint : colors.card, minHeight: 44 })}>{on && <Check size={16} color="#FFFFFF" strokeWidth={2.6}/>}<Text style={{ color: on ? '#FFFFFF' : colors.ink, fontSize: 15, lineHeight: 20, fontWeight: on ? '600' : '500' }}>{o.label}</Text></Pressable>; })}</View>;
}
export function Toggle({ title, value, onChange }: {
    title: string;
    value: boolean;
    onChange: (b: boolean) => void;
}) {
    const colors = useColors();
    return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ paddingVertical: 6, minHeight: 44, justifyContent: 'center' }}><Row><View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: value ? colors.green : colors.faint, backgroundColor: value ? colors.green : colors.card, alignItems: 'center', justifyContent: 'center' }}>{value && <Check size={16} color="#FFFFFF" strokeWidth={3}/>}</View><View style={{ flex: 1 }}><Txt>{title}</Txt></View></Row></Pressable>;
}
/** Translated message box: `error` in red, otherwise `success` in green, otherwise `info` in blue. */
export function Notice({ error, success, info }: {
    error?: string;
    success?: string;
    info?: string;
}) {
    const t = useI18n();
    const { device } = useStore();
    const key = error || success || info;
    if (!key) return null;
    const tone = tones[error ? 'danger' : success ? 'success' : 'info'];
    const Icon = error ? CircleAlert : success ? CircleCheck : Info;
    return <View accessibilityRole={error ? 'alert' : undefined} style={{ backgroundColor: tone.bg, padding: 14, borderRadius: 14, flexDirection: rtl(device.language) ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}><View style={{ paddingTop: 2 }}><Icon size={20} color={tone.fg} strokeWidth={2.2}/></View><View style={{ flex: 1 }}><Txt color={tone.fg}>{t(key)}</Txt></View></View>;
}
const avatarTones = [['#E4ECFB', '#2B4F9E'], ['#FCEBDD', '#9A4A14'], ['#E0F2E9', '#11734A'], ['#EFE6FA', '#6B3FA0'], ['#FBE6EC', '#A03357']];
/** Initial on a circle. The color comes from the name, so a customer keeps one color everywhere. */
export function Avatar({ name, size = 48 }: {
    name: string;
    size?: number;
}) {
    const letter = Array.from(name.trim())[0]?.toUpperCase() ?? '';
    const [bg, fg] = avatarTones[Array.from(name).reduce((sum, ch) => sum + (ch.codePointAt(0) ?? 0), 0) % avatarTones.length];
    return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.55), color: fg, fontWeight: '700' }}>{letter}</Text></View>;
}
export const statusLook: Record<string, { tone: Tone; icon: LucideIcon }> = {
    new: { tone: 'info', icon: Sparkles },
    in_progress: { tone: 'warning', icon: Scissors },
    ready: { tone: 'success', icon: CircleCheck },
    delivered: { tone: 'neutral', icon: PackageCheck },
    cancelled: { tone: 'danger', icon: CircleX },
};
/** Small colored pill with an icon and text. */
export function Pill({ label, tone, icon: Icon }: { label: string; tone: Tone; icon?: LucideIcon }) {
    const { device } = useStore();
    const look = tones[tone];
    return <View style={{ alignSelf: 'flex-start', flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: look.bg, borderRadius: 999 }}>{Icon && <Icon size={14} color={look.fg} strokeWidth={2.4}/>}<Text numberOfLines={1} style={{ fontSize: 13, lineHeight: 18, fontWeight: '600', color: look.fg }}>{label}</Text></View>;
}
export function StatusBadge({ status }: {
    status: string;
}) { const t = useI18n(); const look = statusLook[status] ?? statusLook.new; return <Pill label={t(status)} tone={look.tone} icon={look.icon}/>; }
export function SectionHeading({ title, action, onPress }: {
    title: string;
    action?: string;
    onPress?: () => void;
}) { const colors = useColors(); const { device } = useStore(); return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12, marginTop: 4 }}><View style={{ flex: 1 }}><Txt heading>{title}</Txt></View>{action && <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ minHeight: 44, flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 2 }}><Text style={{ color: colors.green, fontSize: 15, fontWeight: '600' }}>{action}</Text><Chevron size={18} color={colors.green}/></Pressable>}</View>; }
export function EmptyState({ title, message, icon = ClipboardList }: {
    title: string;
    message?: string;
    icon?: LucideIcon;
}) { return <View style={{ paddingVertical: 28, paddingHorizontal: 16, alignItems: 'center', gap: 8 }}><View style={{ marginBottom: 6 }}><IconWell icon={icon} size={64} round/></View><Txt strong center>{title}</Txt>{message && <Txt muted center>{message}</Txt>}</View>; }
/** A white rounded list; dividers are added between children. */
export function MenuGroup({ children }: { children: React.ReactNode }) {
    const colors = useColors();
    const items = React.Children.toArray(children).filter(Boolean);
    return <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden', boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06)' }}>{items.map((child, index) => <View key={index}>{index > 0 && <View style={{ height: 1, backgroundColor: colors.line, marginHorizontal: 16 }}/>}{child}</View>)}</View>;
}
/** Tappable list row: leading icon or element, title, optional subtitle and trailing detail. */
export function MenuRow({ icon, color, bg, leading, title, subtitle, detail, trailing, onPress, accessibilityLabel, expanded }: {
    icon?: LucideIcon;
    color?: string;
    bg?: string;
    leading?: React.ReactNode;
    title: string;
    subtitle?: string;
    detail?: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    /** Set for rows that open a section in place; shows a down chevron when open. */
    expanded?: boolean;
}) {
    const colors = useColors();
    const { device } = useStore();
    const isRtl = rtl(device.language);
    return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={expanded === undefined ? undefined : { expanded }} disabled={!onPress} onPress={onPress} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 12, minHeight: 64, justifyContent: 'center', backgroundColor: pressed ? colors.mint : 'transparent' })}>
    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
      {leading ?? (icon && <IconWell icon={icon} color={color} bg={bg} size={40}/>)}
      <View style={{ flex: 1, gap: 2 }}><Txt strong>{title}</Txt>{subtitle ? <Txt muted>{subtitle}</Txt> : null}</View>
      {detail ? <Text style={{ fontSize: 14, color: colors.green, fontWeight: '600' }}>{detail}</Text> : null}
      {trailing}
      {onPress && (expanded ? <ChevronDown size={18} color={colors.faint} strokeWidth={2}/> : <Chevron/>)}
    </View>
  </Pressable>;
}
/** Icon followed by text, for contact and detail lines. */
export function InfoRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    const colors = useColors();
    const { device } = useStore();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}><View style={{ paddingTop: 3 }}><Icon size={18} color={colors.muted} strokeWidth={2}/></View><View style={{ flex: 1 }}><Txt>{children}</Txt></View></View>;
}
/** Total, received and remaining amounts side by side. Remaining is red while money is owed. */
export function MoneySummary({ currency, totalMinor, paidMinor }: { currency: string; totalMinor: number; paidMinor: number }) {
    const t = useI18n();
    const colors = useColors();
    const { device } = useStore();
    const remaining = totalMinor - paidMinor;
    const cells = [
        { key: 'total', value: totalMinor, color: colors.ink, bg: colors.bg },
        { key: 'paid', value: paidMinor, color: tones.success.fg, bg: tones.success.bg },
        { key: 'remaining', value: remaining, color: remaining > 0 ? tones.danger.fg : tones.success.fg, bg: remaining > 0 ? tones.danger.bg : tones.success.bg },
    ];
    return <View style={{ gap: 8 }}><View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', gap: 8 }}>{cells.map(cell => <View key={cell.key} style={{ flex: 1, minWidth: 0, backgroundColor: cell.bg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, gap: 4, alignItems: 'center', justifyContent: 'space-between' }}>
      <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: colors.muted, textAlign: 'center' }}>{t(cell.key)}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: cell.color, fontVariant: ['tabular-nums'] }}>{formatMoney(cell.value)}</Text>
    </View>)}</View><Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>{currency}</Text></View>;
}
const navItems = [{ key: 'overview', path: '/', icon: House }, { key: 'customers', path: '/customers', icon: Users }, { key: 'orders', path: '/orders', icon: ClipboardList }, { key: 'templates', path: '/templates', icon: Ruler }, { key: 'settings', path: '/settings', icon: Settings }];
export function Screen({ title, children, back = true, compact = false, hero }: {
    title: string;
    children: React.ReactNode;
    back?: boolean;
    compact?: boolean;
    /** Extra content shown on the colored header, under the title. */
    hero?: React.ReactNode;
}) {
    const colors = useColors();
    const t = useI18n();
    const { busy, device, loading, error } = useStore();
    const shop = useShop();
    const insets = useSafeAreaInsets();
    const path = usePathname();
    const isRtl = rtl(device.language);
    const main = navItems.some(i => i.path === path);
    const dashboard = path === '/';
    const showNav = main && shop?.setupComplete;
    const eyebrow = dashboard ? t('app') : shop?.name ?? t('app');
    return <View style={{ flex: 1, backgroundColor: colors.outer }}><View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: colors.navy, paddingTop: insets.top }}>
    <View style={{ backgroundColor: colors.navy, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}><View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
      {back && !main ? <Pressable accessibilityRole="button" accessibilityLabel={t('back')} hitSlop={6} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.12)' })}>{isRtl ? <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.2}/> : <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2}/>}</Pressable> : <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>{shop?.logoPath ? <Image source={{ uri: shop.logoPath }} resizeMode="cover" style={{ width: 44, height: 44, borderRadius: 12 }}/> : <BrandEmblem size={44} light/>}</View>}
      <View style={{ flex: 1, gap: 1 }}><Text numberOfLines={1} style={{ color: colors.headerMuted, fontSize: 12, lineHeight: 16, letterSpacing: isRtl ? 0 : 0.8, fontWeight: '600', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? eyebrow : eyebrow.toUpperCase()}</Text><Text numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 21, lineHeight: 27, textAlign: isRtl ? 'right' : 'left' }}>{title}</Text></View>
      {showNav && <Pressable accessibilityRole="button" accessibilityLabel={t('findCustomer')} onPress={() => router.push('/customer-search')} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: pressed ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.12)' })}><Search size={21} color="#FFFFFF" strokeWidth={2.2}/></Pressable>}
    </View>{hero && <View style={{ marginTop: 16, gap: 12 }}>{hero}</View>}</View>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: compact ? 14 : 20, gap: compact ? 12 : 16, paddingBottom: 32 + (showNav ? 0 : insets.bottom) }}>{isWalkthrough && <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, backgroundColor: tones.warning.bg, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}><FlaskConical size={16} color={tones.warning.fg} strokeWidth={2.2}/><Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: tones.warning.fg, fontWeight: '600', textAlign: isRtl ? 'right' : 'left' }}>{t('demoBanner')}</Text></View>}{children}{busy && !loading && !error && <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'center', gap: 8, alignItems: 'center', paddingTop: 8 }}><ActivityIndicator size="small" color={colors.green}/><Text style={{ color: colors.muted, fontSize: 14 }}>{t('saving')}</Text></View>}</ScrollView></KeyboardAvoidingView>
    {showNav && <View style={{ backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.line, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), paddingHorizontal: 4, flexDirection: isRtl ? 'row-reverse' : 'row' }}>{navItems.map(item => { const active = item.path === path; const Icon = item.icon; return <Pressable key={item.path} accessibilityRole="tab" accessibilityLabel={t(item.key)} accessibilityState={{ selected: active }} onPress={() => { if (!active)
        router.replace(item.path as '/'); }} style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2, minHeight: 56 }}><View style={{ borderRadius: 999, paddingVertical: 5, paddingHorizontal: 18, backgroundColor: active ? colors.mint : 'transparent' }}><Icon size={23} color={active ? colors.green : colors.muted} strokeWidth={active ? 2.4 : 2}/></View><Text numberOfLines={1} style={{ fontSize: 12, lineHeight: 16, fontWeight: active ? '700' : '500', color: active ? colors.green : colors.muted }}>{t(item.key === 'templates' ? 'templatesShort' : item.key)}</Text></Pressable>; })}</View>}
  </View></View>;
}
export { ChevronRight };
