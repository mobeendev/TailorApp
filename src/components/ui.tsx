import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './AppText';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardList, House, LayoutTemplate, Search, Settings2, Users, type LucideIcon } from 'lucide-react-native';
import { useI18n, useShop, useStore, usePalette } from '../store';
import { rtl } from '../localization';
import { BrandEmblem } from './Brand';
import { isWalkthrough } from '../database/mode';
import type { Palette } from '../domain/themes';
export const useColors = usePalette;
const createStyles = (colors: Palette) => StyleSheet.create({
    card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18, gap: 14 },
    title: { fontSize: 23, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, lineHeight: 32 },
    text: { fontSize: 14, color: colors.ink, lineHeight: 23 },
    muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
    row: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 14, fontSize: 15, color: colors.ink, minHeight: 50 },
    error: { color: '#B33B39', fontSize: 13, lineHeight: 21 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#E8F6EF' },
    big: { fontSize: 28, fontWeight: '700', color: colors.green, letterSpacing: -1 },
});
export function useStyles() { return createStyles(useColors()); }
export function Txt({ children, muted = false, title = false }: {
    children: React.ReactNode;
    muted?: boolean;
    title?: boolean;
}) {
    const styles = useStyles();
    const { device } = useStore();
    return <Text style={[title ? styles.title : muted ? styles.muted : styles.text, { textAlign: rtl(device.language) ? 'right' : 'left', writingDirection: rtl(device.language) ? 'rtl' : 'ltr' }]}>{children}</Text>;
}
export function Button({ title, onPress, secondary = false, disabled = false, icon: Icon }: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
    icon?: LucideIcon;
}) {
    const colors = useColors();
    const { busy, device } = useStore();
    return <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={({ pressed }) => ({ minHeight: 50, borderRadius: 12, padding: 14, gap: 9, flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: secondary ? colors.line : colors.green, backgroundColor: secondary ? '#fff' : colors.green, opacity: disabled || busy ? 0.45 : pressed ? 0.75 : 1 })}>
    {Icon && <Icon size={18} color={secondary ? colors.green : '#fff'} strokeWidth={1.8}/>}<Text style={{ fontSize: 14, fontWeight: '600', textAlign: 'center', flexShrink: 1, color: secondary ? colors.green : '#fff' }}>{title}</Text>
  </Pressable>;
}
export function Card({ children, compact = false }: {
    children: React.ReactNode;
    compact?: boolean;
}) { const styles = useStyles(); return <View style={[styles.card, compact && { padding: 12, gap: 10 }]}>{children}</View>; }
export function Pair({ children }: { children: React.ReactNode }) {
    const { device } = useStore();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', gap: 8, alignItems: 'stretch' }}>{React.Children.map(children, child => <View style={{ flex: 1, minWidth: 0 }}>{child}</View>)}</View>;
}
export function Row({ children }: {
    children: React.ReactNode;
}) { const styles = useStyles(); const { device } = useStore(); return <View style={[styles.row, { flexDirection: rtl(device.language) ? 'row-reverse' : 'row' }]}>{children}</View>; }
export function Input({ label, value, onChange, numeric = false, multiline = false, error, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    numeric?: boolean;
    multiline?: boolean;
    error?: string;
    placeholder?: string;
}) {
    const styles = useStyles();
    const colors = useColors();
    const { device } = useStore();
    const [focused, setFocused] = useState(false);
    return <View style={{ gap: 8 }}><Text style={{ fontSize: 12, fontWeight: '600', color: '#4D686F', textAlign: rtl(device.language) ? 'right' : 'left' }}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} placeholder={placeholder} placeholderTextColor="#A0AFB0" underlineColorAndroid="transparent" style={[styles.input, { borderColor: error ? '#C45D56' : focused ? colors.green : colors.line, backgroundColor: '#fff', textAlign: rtl(device.language) ? 'right' : 'left', ...(multiline ? { minHeight: 95, textAlignVertical: 'top' as const } : {}) }]}/>{error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</View>;
}
export function SearchInput({ label, value, onChange, autoFocus = false }: {
    autoFocus?: boolean;
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const colors = useColors();
    const { device } = useStore();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.line }}><Search size={20} color={colors.green}/><TextInput autoFocus={autoFocus} accessibilityLabel={label} placeholder={label} placeholderTextColor="#829493" value={value} onChangeText={onChange} style={{ flex: 1, minHeight: 48, color: colors.ink, fontSize: 15, textAlign: rtl(device.language) ? 'right' : 'left' }}/></View>;
}
export function Choice({ options, value, onChange }: {
    options: {
        value: string;
        label: string;
    }[];
    value: string;
    onChange: (v: string) => void;
}) {
    const colors = useColors();
    return <Row>{options.map(o => <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === o.value }} key={o.value} onPress={() => onChange(o.value)} style={({ pressed }) => ({ borderWidth: 1, borderColor: value === o.value ? colors.green : colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: value === o.value ? colors.green : '#fff', minHeight: 44, opacity: pressed ? 0.65 : 1 })}><Text style={{ color: value === o.value ? '#fff' : colors.ink, fontSize: 13, fontWeight: value === o.value ? '600' : '500' }}>{o.label}</Text></Pressable>)}</Row>;
}
export function Toggle({ title, value, onChange }: {
    title: string;
    value: boolean;
    onChange: (b: boolean) => void;
}) {
    const colors = useColors();
    return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ paddingVertical: 8, minHeight: 44 }}><Row><View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: value ? colors.green : '#C4D3CD', backgroundColor: value ? colors.green : '#fff', alignItems: 'center', justifyContent: 'center' }}>{value && <Check size={14} color="#fff" strokeWidth={3}/>}</View><Txt>{title}</Txt></Row></Pressable>;
}
export function Notice({ error }: {
    error: string;
}) { const styles = useStyles(); const t = useI18n(); return error ? <View style={{ backgroundColor: '#FFF0ED', padding: 13, borderRadius: 10 }}><Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text></View> : null; }
export function Avatar({ name, index = 0 }: {
    name: string;
    index?: number;
}) {
    const palette = [['#EDF2FF', '#647DD6'], ['#FFF1E8', '#D79362'], ['#E5F6EE', '#4C9A76'], ['#F4EBFC', '#A577CA']][index % 4];
    return <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: palette[0], alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 19, color: palette[1], fontWeight: '600' }}>{Array.from(name.trim())[0]?.toUpperCase()}</Text></View>;
}
export function StatusBadge({ status }: {
    status: string;
}) { const t = useI18n(); const palette = status === 'ready' || status === 'delivered' ? ['#E5F5ED', '#21875E'] : status === 'cancelled' ? ['#FCEEEB', '#B86A5E'] : ['#FFF4DD', '#AA7D30']; return <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: palette[0], borderRadius: 7 }}><Text style={{ fontSize: 10, fontWeight: '600', color: palette[1] }}>{t(status)}</Text></View>; }
export function SectionHeading({ title, action, onPress }: {
    title: string;
    action?: string;
    onPress?: () => void;
}) { const colors = useColors(); return <Row><View style={{ flex: 1 }}><Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{title}</Text></View>{action && <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 8 }}><Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>{action}</Text></Pressable>}</Row>; }
export function EmptyState({ title, message, icon: Icon = ClipboardList }: {
    title: string;
    message?: string;
    icon?: LucideIcon;
}) { return <View style={{ paddingVertical: 32, alignItems: 'center', gap: 10 }}><View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: '#E9F2ED', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}><Icon size={27} color="#79A18F" strokeWidth={1.5}/></View><Txt>{title}</Txt>{message && <Txt muted>{message}</Txt>}</View>; }
const navItems = [{ key: 'overview', path: '/', icon: House }, { key: 'customers', path: '/customers', icon: Users }, { key: 'orders', path: '/orders', icon: ClipboardList }, { key: 'templates', path: '/templates', icon: LayoutTemplate }, { key: 'settings', path: '/settings', icon: Settings2 }];
export function Screen({ title, children, back = true, compact = false }: {
    title: string;
    children: React.ReactNode;
    back?: boolean;
    compact?: boolean;
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
    return <View style={{ flex: 1, backgroundColor: colors.outer }}><View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: colors.navy, paddingTop: insets.top }}>
    <View style={{ backgroundColor: colors.navy, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}><Row>
      {back && !main ? <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ width: 42, height: 44, justifyContent: 'center' }}>{isRtl ? <ArrowRight size={22} color="#fff"/> : <ArrowLeft size={22} color="#fff"/>}</Pressable> : <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>{shop?.logoPath ? <Image source={{ uri: shop.logoPath }} style={{ width: 40, height: 40, borderRadius: 12 }}/> : <BrandEmblem size={42} light/>}</View>}
      <View style={{ flex: 1, gap: 2 }}><Text numberOfLines={1} style={{ color: '#D5C6A8', fontSize: 10, letterSpacing: isRtl ? 0 : 1, fontWeight: '600', textAlign: isRtl ? 'right' : 'left' }}>{dashboard ? t('app').toUpperCase() : shop?.name ?? t('app')}</Text><Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 20, textAlign: isRtl ? 'right' : 'left' }}>{title}</Text></View>
      {showNav && <Pressable accessibilityRole="button" accessibilityLabel={t('findCustomer')} onPress={() => router.push('/customer-search')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFFFFF16' }}><Search size={20} color="#fff"/></Pressable>}
    </Row></View>
    {isWalkthrough && <View style={{ backgroundColor: '#E7C88E', padding: 7, alignItems: 'center' }}><Text style={{ fontSize: 10, color: '#493C24', fontWeight: '600' }}>{t('demoBanner')}</Text></View>}
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: compact ? 14 : 22, gap: compact ? 10 : 18, paddingBottom: 28 + (showNav ? 0 : insets.bottom) }}>{children}{busy && !loading && !error && <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'center', gap: 6, alignItems: 'center', paddingTop: 8 }}><ActivityIndicator size="small" color={colors.green}/><Text style={{ color: colors.muted, fontSize: 11 }}>{t('saving')}</Text></View>}</ScrollView></KeyboardAvoidingView>
    {showNav && <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.line, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 8), paddingHorizontal: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>{navItems.map(item => { const active = item.path === path; const Icon = item.icon; return <Pressable key={item.path} accessibilityRole="tab" accessibilityLabel={t(item.key)} accessibilityState={{ selected: active }} onPress={() => { if (!active)
        router.replace(item.path as '/'); }} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4, minHeight: 52 }}><View style={{ borderRadius: 12, paddingVertical: 4, paddingHorizontal: 14, backgroundColor: active ? colors.mint : 'transparent' }}><Icon size={20} color={active ? colors.green : colors.muted} strokeWidth={active ? 2.2 : 1.7}/></View><Text numberOfLines={1} style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? colors.green : colors.muted }}>{t(item.key === 'templates' ? 'templatesShort' : item.key)}</Text></Pressable>; })}</View>}
  </View></View>;
}
export { ChevronRight };

