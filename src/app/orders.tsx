import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { CalendarDays, ClipboardList, ClipboardPlus } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Chevron, Choice, EmptyState, FieldLabel, Screen, SearchInput, StatusBadge, Txt, tones, useColors } from '../components/ui';
import { formatDay } from '../components/Calendar';
import { formatMoney } from '../domain/validation';
import { dailyOrders, dailyWorkCounts, localDay, type WorkFilter } from '../domain/dailyWork';
import { rtl } from '../localization';
export default function Orders() {
    const { filter } = useLocalSearchParams<{ filter?: string }>();
    const colors = useColors();
    const { data, device } = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [status, setStatus] = useState('all');
    const [q, setQ] = useState('');
    const [work, setWork] = useState<WorkFilter>(['today', 'overdue', 'unpaid'].includes(filter ?? '') ? filter as WorkFilter : 'all');
    const [today, setToday] = useState(localDay);
    useEffect(() => { const timer = setInterval(() => setToday(localDay()), 60000); return () => clearInterval(timer); }, []);
    const orders = dailyOrders(data, shop.id, today, work, status, q);
    const workCounts = dailyWorkCounts(data, shop.id, today);
    const workFilters = ['all', 'today', 'overdue', 'unpaid'] as const;
    const isRtl = rtl(device.language);
    const dir = isRtl ? 'row-reverse' as const : 'row' as const;
    return <Screen title={t('orders')}>
    <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><View style={{ flex: 1, gap: 2 }}><Txt title>{t('orderBook')}</Txt><Txt muted>{t('orderBookHint')}</Txt></View><Button compact title={t('newOrder')} icon={ClipboardPlus} onPress={() => router.push('/order-edit')}/></View>
    <SearchInput label={t('searchOrders')} value={q} onChange={setQ}/>
    <View style={{ gap: 8 }}><FieldLabel>{t('dailyWork')}</FieldLabel><Choice value={work} onChange={v => setWork(v as WorkFilter)} options={workFilters.map(value => ({ value, label: `${t(value === 'all' ? 'allWork' : value === 'today' ? 'dueToday' : value === 'overdue' ? 'overdueOrders' : 'unpaidOrders')} (${workCounts[value]})` }))}/>{work !== 'all' && <Txt muted>{t('dailyFiltersHint')}</Txt>}</View>
    <View style={{ gap: 8 }}><FieldLabel>{t('status')}</FieldLabel><Choice value={status} options={['all', 'new', 'in_progress', 'ready', 'delivered', 'cancelled'].map(v => ({ value: v, label: t(v) }))} onChange={setStatus}/></View>
    {orders.length ? orders.map(o => { const customer = data.customers.find(c => c.id === o.customerId); const paid = data.payments.filter(p => p.orderId === o.id).reduce((sum, p) => sum + p.amountMinor, 0); const due = o.totalMinor - paid; return <Pressable accessibilityRole="button" accessibilityLabel={`${t('orderSummary')}: ${o.orderNumber}`} key={o.id} onPress={() => router.push({ pathname: '/order', params: { id: o.id } })} style={({ pressed }) => ({ borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 12, backgroundColor: pressed ? colors.mint : colors.card, boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06)' })}>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={customer?.name ?? ''}/><View style={{ flex: 1, gap: 2 }}><Txt strong lines={1}>{customer?.name}</Txt><Txt muted>{o.orderNumber}</Txt></View><StatusBadge status={o.status}/></View>
      <View style={{ height: 1, backgroundColor: colors.line }}/>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 8 }}>
        <CalendarDays size={18} color={colors.muted} strokeWidth={2}/>
        <View style={{ flex: 1 }}><Txt muted>{formatDay(o.deliveryDate, device.language) || o.deliveryDate}</Txt></View>
        <View style={{ alignItems: isRtl ? 'flex-start' : 'flex-end', gap: 2 }}><Text style={{ fontWeight: '700', color: colors.ink, fontSize: 16, fontVariant: ['tabular-nums'] }}>{o.currency} {formatMoney(o.totalMinor)}</Text><Text style={{ fontSize: 13, fontWeight: '600', color: due > 0 ? tones.danger.fg : tones.success.fg }}>{t('remaining')}: {formatMoney(due)}</Text></View>
        <Chevron/>
      </View>
    </Pressable>; }) : <EmptyState title={t('noResults')} message={t(work !== 'all' || status !== 'all' || q ? 'noFilteredOrders' : 'noOrders')} icon={ClipboardList}/>}
  </Screen>;
}
