import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from './AppText';
import { useI18n, useStore } from '../store';
import { Button, Pair, Row, Txt, useColors } from './ui';
import { calendarDays, daysFromToday, parseLocalDay } from '../domain/ease';
import { localDay } from '../domain/dailyWork';
import { rtl } from '../localization';

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 12);
export const dateLocale = (language: string) => language === 'ur' ? 'ur-PK' : 'en-PK';
export function formatDay(value: string, language: string) {
    const date = parseLocalDay(value);
    return date ? date.toLocaleDateString(dateLocale(language), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** Month grid with previous/next navigation. Today is outlined; the selected day is filled. */
export function MonthCalendar({ value, onSelect }: { value: string; onSelect: (date: string) => void }) {
    const t = useI18n(); const { device } = useStore(); const colors = useColors();
    const isRtl = rtl(device.language);
    const locale = dateLocale(device.language);
    const [month, setMonth] = useState(() => monthStart(parseLocalDay(value) ?? new Date()));
    const today = localDay();
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i, 12).toLocaleDateString(locale, { weekday: 'short' }));
    const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1, 12));
    const Prev = isRtl ? ChevronRight : ChevronLeft;
    const Next = isRtl ? ChevronLeft : ChevronRight;
    return <View style={{ gap: 10 }}>
        <Row>
            <Pressable accessibilityRole="button" accessibilityLabel={t('previousMonth')} onPress={() => shift(-1)} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Prev size={22} color={colors.ink}/></Pressable>
            <View style={{ flex: 1 }}><Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.ink }}>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('nextMonth')} onPress={() => shift(1)} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Next size={22} color={colors.ink}/></Pressable>
        </Row>
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>{weekdays.map((day, i) => <Text key={i} style={{ width: '14.2857%', textAlign: 'center', fontSize: 11, color: colors.muted }}>{day}</Text>)}</View>
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>{calendarDays(month.getFullYear(), month.getMonth()).map((date, i) => {
            if (!date) return <View key={`blank-${i}`} style={{ width: '14.2857%', minHeight: 44 }}/>;
            const selected = value === date;
            return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${t('chooseDate')}: ${date}`} accessibilityState={{ selected }} onPress={() => onSelect(date)} style={{ width: '14.2857%', minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: selected ? colors.green : 'transparent', borderWidth: date === today && !selected ? 1 : 0, borderColor: colors.green }}>
                <Text style={{ color: selected ? '#fff' : colors.ink, fontSize: 15, fontWeight: date === today ? '600' : '400' }}>{Number(date.slice(-2)).toLocaleString(locale)}</Text>
            </Pressable>;
        })}</View>
    </View>;
}

/** Form field that shows the chosen date like an input and opens a calendar dialog when tapped. */
export function DateField({ label, value, onChange, error, labelLines }: { label: string; value: string; onChange: (date: string) => void; error?: string; labelLines?: number }) {
    const t = useI18n(); const { device } = useStore(); const colors = useColors();
    const [open, setOpen] = useState(false);
    const isRtl = rtl(device.language);
    const shown = formatDay(value, device.language);
    const pick = (date: string) => { onChange(date); setOpen(false); };
    return <View style={{ gap: 8 }}>
        <Text numberOfLines={labelLines} style={{ fontSize: 12, lineHeight: 16, fontWeight: '600', color: '#4D686F', textAlign: isRtl ? 'right' : 'left', ...(labelLines ? { minHeight: labelLines * (device.language === 'ur' ? 18 : 16) } : {}) }}>{label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${shown || t('chooseDate')}`} onPress={() => setOpen(true)} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: error ? '#C45D56' : colors.line, backgroundColor: '#fff', paddingHorizontal: 12, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
            <CalendarDays size={18} color={colors.green} strokeWidth={1.8}/>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: shown ? colors.ink : '#A0AFB0', textAlign: isRtl ? 'right' : 'left' }}>{shown || t('chooseDate')}</Text>
        </Pressable>
        {error && <Text accessibilityRole="alert" style={{ color: '#B33B39', fontSize: 13, lineHeight: 21 }}>{error}</Text>}
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <Pressable accessibilityLabel={t('closeCalendar')} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0B1F2A88', justifyContent: 'center', padding: 16 }}>
                {/* Inner press handler stops taps on the dialog from closing it. */}
                <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 12 }}>
                    <Txt title>{label}</Txt>
                    <MonthCalendar value={value} onSelect={pick}/>
                    <Pair><Button secondary title={t('closeCalendar')} onPress={() => setOpen(false)}/><Button title={t('dateToday')} onPress={() => pick(daysFromToday(0))}/></Pair>
                </Pressable>
            </Pressable>
        </Modal>
    </View>;
}
