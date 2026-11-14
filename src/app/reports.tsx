import React from 'react';
import { View } from 'react-native';
import { HandCoins, ReceiptText, Wallet, type LucideIcon } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Card, IconWell, Notice, Screen, Txt, tones, useColors } from '../components/ui';
import { Text } from '../components/AppText';
import { formatMoney } from '../domain/validation';
import { rtl } from '../localization';
export default function Reports() {
    const { data, device } = useStore(); const shop = useShop()!; const t = useI18n(); const colors = useColors();
    const orders = data.orders.filter(o => o.shopId === shop.id && o.status !== 'cancelled'); const total = orders.reduce((a, o) => a + o.totalMinor, 0); const ids = new Set(orders.map(o => o.id)); const paid = data.payments.filter(p => ids.has(p.orderId)).reduce((a, p) => a + p.amountMinor, 0);
    const cards: { key: string; value: number; icon: LucideIcon; tone: { fg: string; bg: string } }[] = [{ key: 'total', value: total, icon: ReceiptText, tone: tones.info }, { key: 'paid', value: paid, icon: Wallet, tone: tones.success }, { key: 'totalDue', value: total - paid, icon: HandCoins, tone: total - paid > 0 ? tones.danger : tones.success }];
    return <Screen title={t('reports')}><Notice info="reportsNote"/>{cards.map(card => <Card key={card.key}><View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 14 }}><IconWell icon={card.icon} color={card.tone.fg} bg={card.tone.bg} size={52}/><View style={{ flex: 1, gap: 2 }}><Txt muted>{t(card.key)}</Txt><Text style={{ fontSize: 24, lineHeight: 31, fontWeight: '700', color: card.key === 'totalDue' ? card.tone.fg : colors.ink, textAlign: rtl(device.language) ? 'right' : 'left', fontVariant: ['tabular-nums'] }}>{shop.currency} {formatMoney(card.value)}</Text></View></View></Card>)}</Screen>;
}
