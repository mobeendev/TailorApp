import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, Input, Notice, Screen, Txt } from '../components/ui';
import { formatMoney } from '../domain/validation';
import { recordPayment } from '../domain/services';
import { garmentName, displayTimestamp } from '../domain/displayNames';
import { collectRemaining } from '../domain/ease';
import type { OrderStatus } from '../domain/model';
export default function OrderDetails() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const store = useStore(); const shop = useShop()!; const t = useI18n(); const [error, setError] = useState(''); const [amount, setAmount] = useState(''); const [fullPayment, setFullPayment] = useState<{ orderId: string; amountMinor: number } | null>(null); const o = store.data.orders.find(o => o.id === id && o.shopId === shop.id); if (!o)
    return <Screen title={t('orders')}><Txt>{t('notFound')}</Txt></Screen>; const payments = store.data.payments.filter(p => p.orderId === id); const paid = payments.reduce((n, p) => n + p.amountMinor, 0); return <Screen title={t('orderSummary')}><Txt title>{store.data.customers.find(c => c.id === o.customerId)?.name}</Txt><Txt>{o.orderNumber}</Txt><Card><Txt>{t('delivery')}: {o.deliveryDate}</Txt><Txt>{t('total')}: {o.currency} {formatMoney(o.totalMinor)}</Txt><Txt>{t('paid')}: {formatMoney(paid)}</Txt><Txt title>{t('remaining')}: {formatMoney(o.totalMinor - paid)}</Txt><Txt>{o.instructions}</Txt></Card><Txt>{t('status')}</Txt><Choice value={o.status} options={['new', 'in_progress', 'ready', 'delivered', 'cancelled'].map(value => ({ value, label: t(value) }))} onChange={async (status) => { try {
    const next = structuredClone(store.data);
    Object.assign(next.orders.find(item => item.id === id)!, { status: status as OrderStatus, recordVersion: o.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
    await store.commit(next);
}
catch (e) {
    setError((e as Error).message);
} }}/><Txt title>{t('garments')}</Txt>{store.data.orderItems.filter(i => i.orderId === id).map(item => <Card key={item.id}><Txt>{garmentName(item.garment, store.device.language)} × {item.quantity}</Txt><Button secondary title={t('measurement')} onPress={() => router.push({ pathname: '/measurement', params: { id: item.measurementId, customerId: o.customerId } })}/></Card>)}<Txt title>{t('paymentHistory')}</Txt>{payments.map(p => <Txt key={p.id}>{displayTimestamp(p.createdAt, store.device.language)} · {o.currency} {formatMoney(p.amountMinor)}</Txt>)}{paid < o.totalMinor && o.status !== 'cancelled' && <Card>{fullPayment === null || fullPayment.orderId !== id ? <><Button secondary title={t('collectFullBalance')} onPress={() => { setAmount(formatMoney(o.totalMinor - paid)); setFullPayment({ orderId: id, amountMinor: o.totalMinor - paid }); setError(''); }}/><Input label={t('payment')} value={amount} numeric onChange={setAmount}/><Button title={t('addPayment')} onPress={async () => { try {
    await store.commit(recordPayment(store.data, store.ctx, shop.id, id, amount));
    setAmount('');
    setError('');
}
catch (e) {
    setError((e as Error).message);
} }}/></> : <><Txt title>{t('confirmFullPayment')}</Txt><Txt>{store.data.customers.find(c => c.id === o.customerId)?.name} · {o.orderNumber}</Txt><Txt>{t('payment')}: {o.currency} {formatMoney(fullPayment.amountMinor)}</Txt><Txt muted>{t('fullPaymentHint')}</Txt><Button title={t('confirmPayment')} onPress={async () => { if (store.busy) return; try { await store.commit(collectRemaining(store.data, store.ctx, shop.id, fullPayment.orderId, fullPayment.amountMinor)); setFullPayment(null); setAmount(''); setError(''); } catch (e) { setError((e as Error).message); setFullPayment(null); } }}/><Button secondary title={t('cancel')} onPress={() => setFullPayment(null)}/></>}</Card>}<Notice error={error}/><Button title={t('receipt')} onPress={() => router.push({ pathname: '/receipt', params: { id } })}/></Screen>; }

