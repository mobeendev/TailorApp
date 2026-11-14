import { availableTemplate } from '../domain/availableTemplate';
import { displayTimestamp } from '../domain/displayNames';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Archive, ArrowLeftRight, ClipboardList, ClipboardPlus, Copy, Eye, MapPin, Pencil, Phone, Ruler, Shirt, StickyNote } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Card, EmptyState, IconButton, IconWell, InfoRow, MenuGroup, MenuRow, Notice, Pair, Pill, Screen, SectionHeading, StatusBadge, Txt } from '../components/ui';
import { formatDay } from '../components/Calendar';
import { label, rtl } from '../localization';
export default function CustomerDetails() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const store = useStore(); const shop = useShop()!; const t = useI18n(); const [confirm, setConfirm] = useState(false); const [error, setError] = useState(''); const c = store.data.customers.find(c => c.id === id && c.shopId === shop.id); if (!c)
    return <Screen title={t('customers')}><EmptyState title={t('notFound')}/></Screen>;
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    const measurements = store.data.measurements.filter(m => m.customerId === c.id && m.shopId === shop.id && !m.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const orders = store.data.orders.filter(o => o.customerId === c.id);
    return <Screen title={c.name}>
    <Card>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 14 }}><Avatar name={c.name} size={60}/><View style={{ flex: 1, gap: 4 }}><Txt title>{c.name}</Txt>{c.archived && <Pill label={t('archived')} tone="neutral" icon={Archive}/>}</View><IconButton icon={Pencil} label={t('edit')} onPress={() => router.push({ pathname: '/customer-edit', params: { id } })}/></View>
      {(c.phone || c.address || c.notes) ? <View style={{ gap: 8 }}>{c.phone ? <InfoRow icon={Phone}>{c.phone}</InfoRow> : null}{c.address ? <InfoRow icon={MapPin}>{c.address}</InfoRow> : null}{c.notes ? <InfoRow icon={StickyNote}>{c.notes}</InfoRow> : null}</View> : null}
      {!c.archived && <Pair><Button secondary icon={Ruler} title={t('newMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId: id } })}/><Button icon={ClipboardPlus} title={t('newOrder')} onPress={() => router.push({ pathname: '/order-edit', params: { customerId: id } })}/></Pair>}
    </Card>
    <SectionHeading title={t('history')}/>
    {measurements.length > 1 && <Button secondary compact icon={ArrowLeftRight} title={t('compareMeasurements')} onPress={() => router.push({ pathname: '/measurement-compare', params: { customerId: c.id } })}/>}
    {!measurements.length && <Card><EmptyState title={t('noMeasurements')} icon={Ruler}/></Card>}
    {measurements.map(m => { const template = store.data.templates.find(t => t.id === m.templateId)!; return <Card compact key={m.id}>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><IconWell icon={Shirt} size={44}/><View style={{ flex: 1, gap: 2 }}><Txt strong>{label(template.labels, store.device.language)} · {t('version')} {m.templateVersion}</Txt><Txt muted>{displayTimestamp(m.createdAt, store.device.language)}</Txt></View></View>
      <Pair><Button secondary compact icon={Eye} title={t('review')} onPress={() => router.push({ pathname: '/measurement', params: { id: m.id, customerId: c.id } })}/>{!c.archived && availableTemplate(store.data, shop.id)?.id === template.id && <Button secondary compact icon={Copy} title={t('copyMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId: c.id, sourceId: m.id } })}/>}</Pair>
    </Card>; })}
    <SectionHeading title={t('orderHistory')}/>
    {orders.length ? <MenuGroup>{orders.map(o => <MenuRow key={o.id} icon={ClipboardList} accessibilityLabel={`${t('orderSummary')}: ${o.orderNumber}`} title={o.orderNumber} subtitle={`${t('delivery')}: ${formatDay(o.deliveryDate, store.device.language) || o.deliveryDate}`} trailing={<StatusBadge status={o.status}/>} onPress={() => router.push({ pathname: '/order', params: { id: o.id } })}/>)}</MenuGroup> : <Card><EmptyState title={t('noOrders')} icon={ClipboardList}/></Card>}
    {!c.archived && <>{!confirm && <Button tone="danger" icon={Archive} title={t('archive')} onPress={() => setConfirm(true)}/>}{confirm && <Card><Notice info="archiveConfirm"/><Pair><Button secondary title={t('cancel')} onPress={() => setConfirm(false)}/><Button tone="destructive" icon={Archive} title={t('confirm')} onPress={async () => { try {
    const next = structuredClone(store.data);
    Object.assign(next.customers.find(i => i.id === c.id)!, { archived: true, recordVersion: c.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
    await store.commit(next);
    setConfirm(false);
}
catch (e) {
    setError((e as Error).message);
} }}/></Pair></Card>}</>}<Notice error={error}/></Screen>; }
