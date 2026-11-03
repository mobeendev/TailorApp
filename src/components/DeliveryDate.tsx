import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useI18n, useStore } from '../store';
import { Button, Choice, Row, Txt, useColors } from './ui';
import { calendarDays, daysFromToday, parseLocalDay } from '../domain/ease';
export function DeliveryDate({ value, onChange }: { value: string; onChange: (date: string) => void }) {
    const t = useI18n(); const { device } = useStore(); const colors = useColors();
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1, 12); });
    const locale = device.language === 'ur' ? 'ur-PK' : 'en-PK';
    const selected = parseLocalDay(value);
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i, 12).toLocaleDateString(locale, { weekday: 'short' }));
    return <View style={{ gap: 12 }}><Txt>{t('deliveryDateShort')}</Txt>
        <Choice value={String([0, 1, 7].find(days => daysFromToday(days) === value) ?? '')} options={[0, 1, 7].map(days => ({ value: String(days), label: t(days === 0 ? 'dateToday' : days === 1 ? 'dateTomorrow' : 'dateNextWeek') }))} onChange={days => { onChange(daysFromToday(Number(days))); setOpen(false); }}/>
        <Button secondary title={`${t('calendar')}${selected ? ` · ${selected.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`} onPress={() => { if (!open) { const date = selected ?? new Date(); setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); } setOpen(!open); }}/>
        {open && <View style={{ padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#fff', gap: 10 }}>
            <Row><Pressable accessibilityRole="button" accessibilityLabel={t('previousMonth')} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>{device.language === 'ur' ? <ChevronRight size={22} color={colors.ink}/> : <ChevronLeft size={22} color={colors.ink}/>}</Pressable><View style={{ flex: 1 }}><Txt>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Txt></View><Pressable accessibilityRole="button" accessibilityLabel={t('nextMonth')} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>{device.language === 'ur' ? <ChevronLeft size={22} color={colors.ink}/> : <ChevronRight size={22} color={colors.ink}/>}</Pressable></Row>
            <View style={{ flexDirection: device.language === 'ur' ? 'row-reverse' : 'row' }}>{weekdays.map((day, i) => <Text key={i} style={{ width: '14.2857%', textAlign: 'center', fontSize: 11, color: colors.muted }}>{day}</Text>)}</View>
            <View style={{ flexDirection: device.language === 'ur' ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>{calendarDays(month.getFullYear(), month.getMonth()).map((date, i) => date ? <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${t('chooseDate')}: ${date}`} accessibilityState={{ selected: value === date }} onPress={() => { onChange(date); setOpen(false); }} style={{ width: '14.2857%', minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 9, backgroundColor: value === date ? colors.green : 'transparent' }}><Text style={{ color: value === date ? '#fff' : colors.ink, fontSize: 15 }}>{Number(date.slice(-2)).toLocaleString(locale)}</Text></Pressable> : <View key={`blank-${i}`} style={{ width: '14.2857%', minHeight: 44 }}/>)}</View>
            <Button secondary title={t('closeCalendar')} onPress={() => setOpen(false)}/>
        </View>}
    </View>;
}
