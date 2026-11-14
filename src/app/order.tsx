import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Banknote, CalendarDays, Check, HandCoins, ReceiptText, Ruler, Shirt, StickyNote } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, EmptyState, IconWell, InfoRow, Input, MenuGroup, MoneySummary, Notice, Pair, Screen, SectionHeading, StatusBadge, Txt } from '../components/ui';
import { formatDay } from '../components/Calendar';
import { formatMoney } from '../domain/validation';
import { recordPayment } from '../domain/services';
import { garmentName, displayTimestamp } from '../domain/displayNames';
import { collectRemaining } from '../domain/ease';
import { rtl } from '../localization';
import type { OrderStatus } from '../domain/model';
export default function OrderDetails() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const store = useStore(); const shop = useShop()!; const t = useI18n(); const [error, setError] = useState(''); const [amount, setAmount] = useState(''); const [fullPayment, setFullPayment] = useState<{ orderId: string; amountMinor: number } | null>(null); const o = store.data.orders.find(o => o.id === id && o.shopId === shop.id); if (!o)
    return <Screen title={t('orders')}><EmptyState title={t('notFound')}/></Screen>;
    const payments = store.data.payments.filter(p => p.orderId === id); const paid = payments.reduce((n, p) => n + p.amountMinor, 0);
    const customerName = store.data.customers.find(c => c.id === o.customerId)?.name;
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    return <Screen title={t('orderSummary')}>
    <Card>
      <View style={{ flexDirection: dir, alignItems: 'flex-start', gap: 12 }}><View style={{ flex: 1, gap: 2 }}><Txt title>{customerName}</Txt><Txt muted>{o.orderNumber}</Txt></View><StatusBadge status={o.status}/></View>
      <InfoRow icon={CalendarDays}>{t('delivery')}: {formatDay(o.deliveryDate, store.device.language) || o.deliveryDate}</InfoRow>
      {o.instructions ? <InfoRow icon={StickyNote}>{o.instructions}</InfoRow> : null}
      <MoneySummary currency={o.currency} totalMinor={o.totalMinor} paidMinor={paid}/>
    </Card>
    <SectionHeading title={t('status')}/>
    <Choice value={o.status} options={['new', 'in_progress', 'ready', 'delivered', 'cancelled'].map(value => ({ value, label: t(value) }))} onChange={async (status) => { try {
    const next = structuredClone(store.data);
    Object.assign(next.orders.find(item => item.id === id)!, { status: status as OrderStatus, recordVersion: o.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
    await store.commit(next);
}
catch (e) {
    setError((e as Error).message);
} }}/>
    <SectionHeading title={t('garments')}/>
    {store.data.orderItems.filter(i => i.orderId === id).map(item => <Card compact key={item.id}><View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><IconWell icon={Shirt}/><View style={{ flex: 1 }}><Txt strong>{garmentName(item.garment, store.device.language)} × {item.quantity}</Txt></View></View><Button secondary compact icon={Ruler} title={t('measurement')} onPress={() => router.push({ pathname: '/measurement', params: { id: item.measurementId, customerId: o.customerId } })}/></Card>)}
    <SectionHeading title={t('paymentHistory')}/>
    {payments.length ? <MenuGroup>{payments.map(p => <View key={p.id} style={{ flexDirection: dir, alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}><IconWell icon={Banknote} size={40} color="#11734A" bg="#E2F4EA"/><View style={{ flex: 1 }}><Txt muted>{displayTimestamp(p.createdAt, store.device.language)}</Txt></View><Txt strong>{o.currency} {formatMoney(p.amountMinor)}</Txt></View>)}</MenuGroup> : null}
    {paid < o.totalMinor && o.status !== 'cancelled' && <Card>{fullPayment === null || fullPayment.orderId !== id ? <><Button secondary icon={HandCoins} title={t('collectFullBalance')} onPress={() => { setAmount(formatMoney(o.totalMinor - paid)); setFullPayment({ orderId: id, amountMinor: o.totalMinor - paid }); setError(''); }}/><Input label={`${t('payment')} (${o.currency})`} value={amount} numeric onChange={setAmount}/><Button icon={Banknote} title={t('addPayment')} onPress={async () => { try {
    await store.commit(recordPayment(store.data, store.ctx, shop.id, id, amount));
    setAmount('');
    setError('');
}
catch (e) {
    setError((e as Error).message);
} }}/></> : <><Txt heading>{t('confirmFullPayment')}</Txt><Txt>{customerName} · {o.orderNumber}</Txt><Txt muted>{t('payment')}</Txt><Txt title>{o.currency} {formatMoney(fullPayment.amountMinor)}</Txt><Notice info="fullPaymentHint"/><Pair><Button secondary title={t('cancel')} onPress={() => setFullPayment(null)}/><Button icon={Check} title={t('confirmPayment')} onPress={async () => { if (store.busy) return; try { await store.commit(collectRemaining(store.data, store.ctx, shop.id, fullPayment.orderId, fullPayment.amountMinor)); setFullPayment(null); setAmount(''); setError(''); } catch (e) { setError((e as Error).message); setFullPayment(null); } }}/></Pair></>}</Card>}
    <Notice error={error}/>
    <Button secondary icon={ReceiptText} title={t('receipt')} onPress={() => router.push({ pathname: '/receipt', params: { id } })}/>
  </Screen>; }
