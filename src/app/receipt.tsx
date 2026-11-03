import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Notice, Screen, Txt } from '../components/ui';
import { formatMoney } from '../domain/validation';
import { garmentName } from '../domain/displayNames';
import { receiptHtml } from '../services/receipt';
import { printReceipt, shareReceipt } from '../services/printing';
export default function Receipt() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const { data, device } = useStore(); const shop = useShop()!; const t = useI18n(); const [error, setError] = useState(''); const order = data.orders.find(o => o.id === id && o.shopId === shop.id); if (!order)
    return <Screen title={t('receipt')}><Txt>{t('notFound')}</Txt></Screen>; const paid = data.payments.filter(p => p.orderId === id).reduce((a, p) => a + p.amountMinor, 0); return <Screen title={t('receipt')}><Card><Txt title>{shop.name}</Txt><Txt>{shop.address}</Txt><Txt>{shop.phone}</Txt><Txt>{order.orderNumber}</Txt><Txt>{data.customers.find(c => c.id === order.customerId)?.name}</Txt><Txt>{t('delivery')}: {order.deliveryDate}</Txt>{data.orderItems.filter(i => i.orderId === id).map(i => <Txt key={i.id}>{garmentName(i.garment, device.language)} × {i.quantity}</Txt>)}<Txt>{t('total')}: {order.currency} {formatMoney(order.totalMinor)}</Txt><Txt>{t('paid')}: {formatMoney(paid)}</Txt><Txt title>{t('remaining')}: {formatMoney(order.totalMinor - paid)}</Txt></Card><Button title={t('print')} onPress={async () => { try {
    setError('');
    await printReceipt(receiptHtml(data, id, device.language, t));
}
catch {
    setError('printFailed');
} }}/>{Platform.OS !== 'web' && <Button secondary title={t('share')} onPress={async () => { try {
    setError('');
    await shareReceipt(receiptHtml(data, id, device.language, t));
}
catch {
    setError('printFailed');
} }}/>}<Notice error={error}/></Screen>; }

