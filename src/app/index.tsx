import React, { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { Banknote, BookOpen, CalendarDays, ChartColumn, ClipboardPlus, ShieldCheck, TriangleAlert, UserPlus, type LucideIcon } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Chevron, EmptyState, IconWell, MenuGroup, MenuRow, Screen, SectionHeading, StatusBadge, Txt, tones, useColors } from '../components/ui';
import { formatDay } from '../components/Calendar';
import { rtl } from '../localization';
import { dailyWorkCounts, localDay } from '../domain/dailyWork';
export default function Dashboard() {
    const colors = useColors();
    const [workDay, setWorkDay] = useState(localDay);
    useEffect(() => { const timer = setInterval(() => setWorkDay(localDay()), 60000); return () => clearInterval(timer); }, []);
    const { loading, error, retry, data, device } = useStore();
    const shop = useShop();
    const t = useI18n();
    const isRtl = rtl(device.language);
    const dir = isRtl ? 'row-reverse' as const : 'row' as const;
    if (loading)
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.bg }}><ActivityIndicator color={colors.green}/><Text style={{ color: colors.muted, fontSize: 16 }}>{t('loading')}</Text></View>;
    if (error)
        return <Screen title={t('app')} back={false}><Txt>{t('loadFailed')}</Txt><Button title={t('retry')} onPress={retry}/></Screen>;
    if (!shop?.setupComplete)
        return <Redirect href="/onboarding"/>;
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const workCounts = dailyWorkCounts(data, shop.id, workDay);
    const customers = data.customers.filter(c => c.shopId === shop.id && !c.archived);
    const orders = data.orders.filter(o => o.shopId === shop.id);
    const pending = orders.filter(o => ['new', 'in_progress'].includes(o.status));
    const ready = orders.filter(o => o.status === 'ready');
    const deliveries = orders.filter(o => !['delivered', 'cancelled'].includes(o.status) && o.deliveryDate >= localDate).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    const work = [
        { filter: 'today' as const, label: 'dueToday', icon: CalendarDays, tone: tones.info },
        { filter: 'overdue' as const, label: 'overdueOrders', icon: TriangleAlert, tone: tones.danger },
        { filter: 'unpaid' as const, label: 'unpaidOrders', icon: Banknote, tone: tones.warning },
    ];
    const tiles: {
        key: string;
        label: string;
        path: string;
        icon: LucideIcon;
        color: string;
        background: string;
    }[] = [
        // Customers, orders, templates and settings are already in the bottom tabs.
        { key: 'reports', label: 'reports', path: '/reports', icon: ChartColumn, color: '#6B3FA0', background: '#EFE6FA' },
        { key: 'backup', label: 'backupShort', path: '/backup', icon: ShieldCheck, color: '#0E7490', background: '#E0F4F7' },
        { key: 'guide', label: 'guide', path: '/guide', icon: BookOpen, color: '#8A5300', background: '#FDF1D8' },
    ];
    const hero = <>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}><Text style={{ color: colors.headerMuted, fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: isRtl ? 'right' : 'left' }}>{today.toLocaleDateString(device.language === 'ur' ? 'ur-PK' : 'en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View>
        <View style={{ flexDirection: dir, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#6EE7B7' }}/><Text style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 17, fontWeight: '600' }}>{t('offlineReady')}</Text></View>
      </View>
      <View style={{ flexDirection: dir, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 12 }}>
        {[{ key: 'totalCustomers', value: customers.length, path: '/customers' }, { key: 'pendingOrders', value: pending.length, path: '/orders' }, { key: 'readyOrders', value: ready.length, path: '/orders' }].map((item, index) => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={`${t(item.key)}: ${item.value}`} onPress={() => router.push(item.path as '/')} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2, borderLeftWidth: index ? 1 : 0, borderColor: 'rgba(255,255,255,0.14)', opacity: pressed ? 0.7 : 1 })}><Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{item.value}</Text><Text style={{ color: colors.headerMuted, fontSize: 13, lineHeight: 18, fontWeight: '500', textAlign: 'center' }}>{t(item.key)}</Text></Pressable>)}
      </View>
    </>;
    return <Screen title={shop.name} back={false} hero={hero}>
    <View style={{ flexDirection: dir, gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('newOrder')} onPress={() => router.push('/order-edit')} style={({ pressed }) => ({ flex: 1, minHeight: 100, backgroundColor: colors.green, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, opacity: pressed ? 0.85 : 1, boxShadow: '0px 4px 12px rgba(16, 24, 40, 0.12)' })}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}><ClipboardPlus size={22} color="#FFFFFF" strokeWidth={2.2}/></View><Text numberOfLines={2} style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '700', textAlign: 'center' }}>{t('newOrder')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('newCustomer')} onPress={() => router.push('/customer-edit')} style={({ pressed }) => ({ flex: 1, minHeight: 100, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.mint : colors.card, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.06)' })}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}><UserPlus size={22} color={colors.green} strokeWidth={2.2}/></View><Text numberOfLines={2} style={{ color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '700', textAlign: 'center' }}>{t('newCustomer')}</Text>
      </Pressable>
    </View>
    <SectionHeading title={t('dailyWork')}/>
    <MenuGroup>{work.map(item => { const count = workCounts[item.filter]; return <MenuRow key={item.filter} icon={item.icon} color={item.tone.fg} bg={item.tone.bg} title={t(item.label)} accessibilityLabel={`${t(item.label)}: ${count}`} onPress={() => router.push({ pathname: '/orders', params: { filter: item.filter } })} trailing={<View style={{ minWidth: 36, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignItems: 'center', backgroundColor: count ? item.tone.bg : colors.bg }}><Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '700', color: count ? item.tone.fg : colors.muted, fontVariant: ['tabular-nums'] }}>{count}</Text></View>}/>; })}</MenuGroup>
    <SectionHeading title={t('upcoming')} action={t('viewAll')} onPress={() => router.push('/orders')}/>
    {deliveries.length ? <MenuGroup>{deliveries.slice(0, 3).map(o => { const name = data.customers.find(c => c.id === o.customerId)?.name ?? ''; return <Pressable key={o.id} accessibilityRole="button" accessibilityLabel={`${t('orderSummary')}: ${name} ${o.orderNumber}`} onPress={() => router.push({ pathname: '/order', params: { id: o.id } })} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? colors.mint : 'transparent' })}><View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={name}/><View style={{ flex: 1, gap: 6 }}><Txt strong lines={1}>{name}</Txt><View style={{ flexDirection: dir, alignItems: 'center', flexWrap: 'wrap', gap: 8 }}><View style={{ flexDirection: dir, alignItems: 'center', gap: 5 }}><CalendarDays size={15} color={colors.muted} strokeWidth={2}/><Txt muted>{formatDay(o.deliveryDate, device.language) || o.deliveryDate}</Txt></View><StatusBadge status={o.status}/></View></View><Chevron/></View></Pressable>; })}</MenuGroup> : <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card }}><EmptyState title={t('noDeliveries')} message={t('deliveryHint')} icon={CalendarDays}/></View>}
    <SectionHeading title={t('quickAccess')}/>
    <View style={{ flexDirection: dir, flexWrap: 'wrap', gap: 10 }}>
      {tiles.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={t(item.label)} onPress={() => router.push(item.path as '/')} style={({ pressed }) => ({ flexBasis: '30%', flexGrow: 1, minHeight: 104, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: pressed ? colors.mint : colors.card, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 6 })}><IconWell icon={item.icon} color={item.color} bg={item.background} size={48} round/><Text numberOfLines={2} style={{ color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '600', textAlign: 'center' }}>{t(item.label)}</Text></Pressable>)}
    </View>
  </Screen>;
}
