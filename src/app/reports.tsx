import React from 'react';
import { useI18n, useShop, useStore } from '../store';
import { Card, Screen, Txt } from '../components/ui';
import { formatMoney } from '../domain/validation';
export default function Reports() { const { data } = useStore(); const shop = useShop()!; const t = useI18n(); const orders = data.orders.filter(o => o.shopId === shop.id && o.status !== 'cancelled'); const total = orders.reduce((a, o) => a + o.totalMinor, 0); const ids = new Set(orders.map(o => o.id)); const paid = data.payments.filter(p => ids.has(p.orderId)).reduce((a, p) => a + p.amountMinor, 0); return <Screen title={t('reports')}><Txt>{t('reportsNote')}</Txt>{[['total', total], ['paid', paid], ['totalDue', total - paid]].map(([key, value]) => <Card key={String(key)}><Txt>{t(String(key))}</Txt><Txt title>{shop.currency} {formatMoney(Number(value))}</Txt></Card>)}</Screen>; }

