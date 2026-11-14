import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Platform, View } from 'react-native';
import { Printer, Share2 } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, EmptyState, Notice, Screen, Txt, tones, useColors } from '../components/ui';
import { Text } from '../components/AppText';
import { formatDay } from '../components/Calendar';
import { formatMoney } from '../domain/validation';
import { garmentName } from '../domain/displayNames';
import { rtl } from '../localization';
import { receiptHtml } from '../services/receipt';
import { printReceipt, shareReceipt } from '../services/printing';
export default function Receipt() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const { data, device } = useStore(); const shop = useShop()!; const t = useI18n(); const colors = useColors(); const [error, setError] = useState(''); const order = data.orders.find(o => o.id === id && o.shopId === shop.id); if (!order)
    return <Screen title={t('receipt')}><EmptyState title={t('notFound')}/></Screen>;
    const paid = data.payments.filter(p => p.orderId === id).reduce((a, p) => a + p.amountMinor, 0);
    const dir = rtl(device.language) ? 'row-reverse' as const : 'row' as const;
    const line = (name: string, value: string, strong = false, color?: string) => <View key={name} style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Txt muted>{name}</Txt></View><Text style={{ fontSize: strong ? 18 : 16, fontWeight: strong ? '700' : '600', color: color ?? colors.ink, fontVariant: ['tabular-nums'] }}>{value}</Text></View>;
    const dashed = <View style={{ borderTopWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' }}/>;
    return <Screen title={t('receipt')}>
    <Card>
      <View style={{ alignItems: 'center', gap: 2 }}><Txt title center>{shop.name}</Txt>{shop.address ? <Txt muted center>{shop.address}</Txt> : null}<Txt muted center>{shop.phone}</Txt></View>
      {dashed}
      {line(t('orderNumber'), order.orderNumber)}
      {line(t('name'), data.customers.find(c => c.id === order.customerId)?.name ?? '')}
      {line(t('delivery'), formatDay(order.deliveryDate, device.language) || order.deliveryDate)}
      {dashed}
      {data.orderItems.filter(i => i.orderId === id).map(i => <Txt key={i.id}>{garmentName(i.garment, device.language)} × {i.quantity}</Txt>)}
      {dashed}
      {line(t('total'), `${order.currency} ${formatMoney(order.totalMinor)}`)}
      {line(t('paid'), formatMoney(paid), false, tones.success.fg)}
      {line(t('remaining'), formatMoney(order.totalMinor - paid), true, order.totalMinor - paid > 0 ? tones.danger.fg : tones.success.fg)}
    </Card>
    <Button icon={Printer} title={t('print')} onPress={async () => { try {
    setError('');
    await printReceipt(receiptHtml(data, id, device.language, t));
}
catch {
    setError('printFailed');
} }}/>{Platform.OS !== 'web' && <Button secondary icon={Share2} title={t('share')} onPress={async () => { try {
    setError('');
    await shareReceipt(receiptHtml(data, id, device.language, t));
}
catch {
    setError('printFailed');
} }}/>}<Notice error={error}/></Screen>; }
