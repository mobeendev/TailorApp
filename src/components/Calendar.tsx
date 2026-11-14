import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from './AppText';
import { useI18n, useStore } from '../store';
import { Button, FieldError, FieldLabel, Pair, Txt, tones, useColors } from './ui';
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
    const navButton = { width: 44, height: 44, borderRadius: 22, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: colors.bg };
    return <View style={{ gap: 10 }}>
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('previousMonth')} onPress={() => shift(-1)} style={navButton}><Prev size={22} color={colors.ink} strokeWidth={2.2}/></Pressable>
            <View style={{ flex: 1 }}><Text style={{ textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.ink }}>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('nextMonth')} onPress={() => shift(1)} style={navButton}><Next size={22} color={colors.ink} strokeWidth={2.2}/></Pressable>
        </View>
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>{weekdays.map((day, i) => <Text key={i} style={{ width: '14.2857%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.muted }}>{day}</Text>)}</View>
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap', rowGap: 2 }}>{calendarDays(month.getFullYear(), month.getMonth()).map((date, i) => {
            if (!date) return <View key={`blank-${i}`} style={{ width: '14.2857%', height: 44 }}/>;
            const selected = value === date;
            const isToday = date === today;
            return <View key={date} style={{ width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel={`${t('chooseDate')}: ${date}`} accessibilityState={{ selected }} onPress={() => onSelect(date)} style={({ pressed }) => ({ width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 21, backgroundColor: selected ? colors.green : pressed ? colors.mint : 'transparent', borderWidth: isToday && !selected ? 2 : 0, borderColor: colors.green })}>
                <Text style={{ color: selected ? '#FFFFFF' : isToday ? colors.green : colors.ink, fontSize: 15, fontWeight: selected || isToday ? '700' : '500' }}>{Number(date.slice(-2)).toLocaleString(locale)}</Text>
            </Pressable></View>;
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
    return <View style={{ gap: 6 }}>
        <FieldLabel lines={labelLines}>{label}</FieldLabel>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${shown || t('chooseDate')}`} onPress={() => setOpen(true)} style={({ pressed }) => ({ minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: error ? tones.danger.fg : colors.line, backgroundColor: pressed ? colors.mint : colors.input, paddingHorizontal: 12, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 })}>
            <CalendarDays size={20} color={colors.green} strokeWidth={2.2}/>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, color: shown ? colors.ink : colors.faint, textAlign: isRtl ? 'right' : 'left' }}>{shown || t('chooseDate')}</Text>
        </Pressable>
        {error && <FieldError>{error}</FieldError>}
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <Pressable accessibilityLabel={t('closeCalendar')} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(11, 22, 30, 0.55)', justifyContent: 'center', padding: 16 }}>
                {/* Inner press handler stops taps on the dialog from closing it. */}
                <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 14, boxShadow: '0px 12px 32px rgba(16, 24, 40, 0.24)' }}>
                    <Txt heading>{label}</Txt>
                    <MonthCalendar value={value} onSelect={pick}/>
                    <Pair><Button secondary title={t('closeCalendar')} onPress={() => setOpen(false)}/><Button icon={CalendarDays} title={t('dateToday')} onPress={() => pick(daysFromToday(0))}/></Pair>
                </Pressable>
            </Pressable>
        </Modal>
    </View>;
}
