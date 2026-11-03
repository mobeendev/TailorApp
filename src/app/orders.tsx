import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { CalendarDays, ChevronRight, ClipboardList, Plus } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Choice, EmptyState, Row, Screen, SearchInput, StatusBadge, Txt, useColors } from '../components/ui';
import { formatMoney } from '../domain/validation';
import { dailyOrders, dailyWorkCounts, localDay, type WorkFilter } from '../domain/dailyWork';
export default function Orders() {
    const { filter } = useLocalSearchParams<{ filter?: string }>();
    const colors = useColors();
    const { data } = useStore();
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
    return <Screen title={t('orders')}><Row><View style={{ flex: 1 }}><Txt title>{t('orderBook')}</Txt><Txt muted>{t('orderBookHint')}</Txt></View><Button title={t('newOrder')} icon={Plus} onPress={() => router.push('/order-edit')}/></Row><Txt muted>{t('dailyFiltersHint')}</Txt><Choice value={work} onChange={v => setWork(v as WorkFilter)} options={workFilters.map(value => ({ value, label: `${t(value === 'all' ? 'allWork' : value === 'today' ? 'dueToday' : value === 'overdue' ? 'overdueOrders' : 'unpaidOrders')} (${workCounts[value]})` }))}/><SearchInput label={t('searchOrders')} value={q} onChange={setQ}/><Choice value={status} options={['all', 'new', 'in_progress', 'ready', 'delivered', 'cancelled'].map(v => ({ value: v, label: t(v) }))} onChange={setStatus}/>
    {orders.length ? orders.map((o, index) => { const customer = data.customers.find(c => c.id === o.customerId); const paid = data.payments.filter(p => p.orderId === o.id).reduce((sum, p) => sum + p.amountMinor, 0); return <Pressable accessibilityRole="button" accessibilityLabel={`${t('orderSummary')}: ${o.orderNumber}`} key={o.id} onPress={() => router.push({ pathname: '/order', params: { id: o.id } })} style={({ pressed }) => ({ borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18, gap: 15, backgroundColor: pressed ? '#EFF7F2' : '#fff' })}><Row><Avatar name={customer?.name ?? ''} index={index}/><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '600', fontSize: 15 }}>{customer?.name}</Text><Txt muted>{o.orderNumber}</Txt></View><StatusBadge status={o.status}/></Row><View style={{ height: 1, backgroundColor: '#EFF3F0' }}/><Row><CalendarDays size={14} color={colors.muted}/><View style={{ flex: 1 }}><Txt muted>{o.deliveryDate}</Txt></View><View style={{ alignItems: 'flex-end' }}><Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{o.currency} {formatMoney(o.totalMinor)}</Text><Txt muted>{t('remaining')}: {formatMoney(o.totalMinor - paid)}</Txt></View><ChevronRight size={16} color="#A8B8B0"/></Row></Pressable>; }) : <EmptyState title={t('noResults')} message={t(work !== 'all' || status !== 'all' || q ? 'noFilteredOrders' : 'noOrders')} icon={ClipboardList}/>}
  </Screen>;
}

