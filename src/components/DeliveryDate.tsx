import React, { useState } from 'react';
import { View } from 'react-native';
import { useI18n, useStore } from '../store';
import { Button, Choice, Txt, useColors } from './ui';
import { daysFromToday } from '../domain/ease';
import { MonthCalendar, formatDay } from './Calendar';
export function DeliveryDate({ value, onChange }: { value: string; onChange: (date: string) => void }) {
    const t = useI18n(); const { device } = useStore(); const colors = useColors();
    const [open, setOpen] = useState(false);
    const shown = formatDay(value, device.language);
    return <View style={{ gap: 12 }}><Txt>{t('deliveryDateShort')}</Txt>
        <Choice value={String([0, 1, 7].find(days => daysFromToday(days) === value) ?? '')} options={[0, 1, 7].map(days => ({ value: String(days), label: t(days === 0 ? 'dateToday' : days === 1 ? 'dateTomorrow' : 'dateNextWeek') }))} onChange={days => { onChange(daysFromToday(Number(days))); setOpen(false); }}/>
        <Button secondary title={`${t('calendar')}${shown ? ` · ${shown}` : ''}`} onPress={() => setOpen(!open)}/>
        {open && <View style={{ padding: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#fff', gap: 10 }}>
            <MonthCalendar value={value} onSelect={date => { onChange(date); setOpen(false); }}/>
            <Button secondary title={t('closeCalendar')} onPress={() => setOpen(false)}/>
        </View>}
    </View>;
}
