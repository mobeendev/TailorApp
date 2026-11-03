import React, { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { BarChart3, CalendarDays, Clock3, CreditCard, ChevronLeft, ChevronRight, ClipboardList, DatabaseBackup, Plus, Ruler, Settings2, UserPlus, Users, type LucideIcon } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Card, EmptyState, Row, Screen, SectionHeading, StatusBadge, Txt, useColors } from '../components/ui';
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
    if (loading)
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /><Text>{t('loading')}</Text></View>;
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
    const tiles: {
        key: string;
        path: string;
        icon: LucideIcon;
        color: string;
        background: string;
    }[] = [
        { key: 'customers', path: '/customers', icon: Users, color: '#648593', background: '#ECF3FF' },
        { key: 'orders', path: '/orders', icon: ClipboardList, color: '#169271', background: '#E7F7EF' },
        { key: 'templates', path: '/templates', icon: Ruler, color: '#D7A13E', background: '#FFF6E3' },
        { key: 'reports', path: '/reports', icon: BarChart3, color: '#9870C9', background: '#F3EDFC' },
        { key: 'backup', path: '/backup', icon: DatabaseBackup, color: '#389FAE', background: '#E7F5F7' },
        { key: 'settings', path: '/settings', icon: Settings2, color: '#7B8E9A', background: '#EDF1F4' },
    ];
    return <Screen title={shop.name} back={false}>
    <Row><View style={{ flex: 1 }}><Text style={{ fontSize: 13, color: colors.muted, textAlign: isRtl ? 'right' : 'left' }}>{today.toLocaleDateString(device.language === 'ur' ? 'ur-PK' : 'en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View><View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, backgroundColor: colors.mint, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }}/><Text style={{ color: colors.green, fontSize: 11, fontWeight: '600' }}>{t('offlineReady')}</Text></View></Row>
    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 10 }}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/order-edit')} style={({ pressed }) => ({ flex: 1, minHeight: 58, backgroundColor: colors.green, borderRadius: 15, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10, opacity: pressed ? 0.8 : 1 })}>
        <Plus size={20} color="#fff"/><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' }}>{t('newOrder')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/customer-edit')} style={({ pressed }) => ({ flex: 1, minHeight: 58, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.mint : '#fff', borderRadius: 15, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 })}>
        <UserPlus size={19} color={colors.green}/><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' }}>{t('newCustomer')}</Text>
      </Pressable>
    </View>
    <View style={{ gap: 12 }}><SectionHeading title={t('dailyWork')}/>
      <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 10 }}>{(['today', 'overdue', 'unpaid'] as const).map(filter => <Pressable key={filter} accessibilityRole="button" accessibilityLabel={`${t(filter === 'today' ? 'dueToday' : filter === 'overdue' ? 'overdueOrders' : 'unpaidOrders')}: ${workCounts[filter]}`} onPress={() => router.push({ pathname: '/orders', params: { filter } })} style={({ pressed }) => ({ flex: 1, minHeight: 125, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.mint : '#fff', justifyContent: 'space-between', alignItems: isRtl ? 'flex-end' : 'flex-start' })}>
        <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: filter === 'today' ? colors.mint : filter === 'overdue' ? '#FCEDEA' : '#FBF2DF' }}>{filter === 'today' ? <CalendarDays size={17} color={colors.green}/> : filter === 'overdue' ? <Clock3 size={17} color="#B65F50"/> : <CreditCard size={17} color="#A8782D"/>}</View>
        <View style={{ gap: 2, alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{workCounts[filter]}</Text><Text style={{ fontSize: 11, lineHeight: 16, color: colors.muted, textAlign: isRtl ? 'right' : 'left' }}>{t(filter === 'today' ? 'dueToday' : filter === 'overdue' ? 'overdueOrders' : 'unpaidOrders')}</Text></View>
      </Pressable>)}</View>
    </View>
    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: colors.navy, borderRadius: 18, paddingVertical: 17, paddingHorizontal: 6 }}>
      {[{ key: 'totalCustomers', value: customers.length }, { key: 'pendingOrders', value: pending.length }, { key: 'readyOrders', value: ready.length }].map((item, index) => <View key={item.key} style={{ flex: 1, alignItems: 'center', gap: 4, borderLeftWidth: index ? 1 : 0, borderColor: '#FFFFFF24' }}><Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{item.value}</Text><Text style={{ color: '#D6E2DD', fontSize: 11, textAlign: 'center' }}>{t(item.key)}</Text></View>)}
    </View>
    <View style={{ gap: 12 }}><SectionHeading title={t('upcoming')} action={t('viewAll')} onPress={() => router.push('/orders')}/>
    {deliveries.length ? <Card>{deliveries.slice(0, 3).map((o, index) => { const name = data.customers.find(c => c.id === o.customerId)?.name ?? ''; return <Pressable key={o.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/order', params: { id: o.id } })} style={{ paddingVertical: 5, borderTopWidth: index ? 1 : 0, paddingTop: index ? 16 : 0, borderColor: colors.line }}><Row><Avatar name={name} index={index}/><View style={{ flex: 1, gap: 3 }}><Txt>{name}</Txt><Txt muted>{o.orderNumber} · {o.deliveryDate}</Txt></View><StatusBadge status={o.status}/>{isRtl ? <ChevronLeft size={16} color="#A8B7B0"/> : <ChevronRight size={16} color="#A8B7B0"/>}</Row></Pressable>; })}</Card> : <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: '#fff' }}><EmptyState title={t('noDeliveries')} message={t('deliveryHint')} icon={CalendarDays}/></View>}
    </View>
    <View style={{ gap: 12 }}><SectionHeading title={t('quickAccess')}/>
    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 10 }}>
      {tiles.map(item => <Pressable key={item.key} accessibilityRole="button" onPress={() => router.push(item.path as '/')} style={({ pressed }) => ({ width: '48%', flexGrow: 1, minHeight: 62, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: pressed ? colors.mint : '#fff', flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, padding: 11 })}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.background, alignItems: 'center', justifyContent: 'center' }}><item.icon size={19} color={item.color} strokeWidth={1.8}/></View><Text style={{ flex: 1, color: colors.ink, fontSize: 12, fontWeight: '600', textAlign: isRtl ? 'right' : 'left' }}>{t(item.key === 'templates' ? 'templatesShort' : item.key === 'backup' ? 'backupShort' : item.key)}</Text>{isRtl ? <ChevronLeft size={15} color={colors.muted}/> : <ChevronRight size={15} color={colors.muted}/>}</Pressable>)}
    </View></View>
  </Screen>;
}
