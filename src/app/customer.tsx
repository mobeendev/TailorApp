import { availableTemplate } from '../domain/availableTemplate';
import { displayTimestamp } from '../domain/displayNames';
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Notice, Screen, Txt } from '../components/ui';
import { label } from '../localization';
export default function CustomerDetails() { const { id } = useLocalSearchParams<{
    id: string;
}>(); const store = useStore(); const shop = useShop()!; const t = useI18n(); const [confirm, setConfirm] = useState(false); const [error, setError] = useState(''); const c = store.data.customers.find(c => c.id === id && c.shopId === shop.id); if (!c)
    return <Screen title={t('customers')}><Txt>{t('notFound')}</Txt></Screen>; const measurements = store.data.measurements.filter(m => m.customerId === c.id && m.shopId === shop.id && !m.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return <Screen title={c.name}><Card><Txt>{c.phone}</Txt><Txt>{c.address}</Txt><Txt>{c.notes}</Txt><Button secondary title={t('edit')} onPress={() => router.push({ pathname: '/customer-edit', params: { id } })}/>{!c.archived && <><Button title={t('newMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId: id } })}/><Button title={t('newOrder')} onPress={() => router.push({ pathname: '/order-edit', params: { customerId: id } })}/></>}</Card><Txt title>{t('history')}</Txt>{measurements.length > 1 && <Button secondary title={t('compareMeasurements')} onPress={() => router.push({ pathname: '/measurement-compare', params: { customerId: c.id } })}/>}{!measurements.length && <Txt>{t('noMeasurements')}</Txt>}{measurements.map(m => { const template = store.data.templates.find(t => t.id === m.templateId)!; return <Card key={m.id}><Txt>{label(template.labels, store.device.language)} · {t('version')} {m.templateVersion}</Txt><Txt muted>{displayTimestamp(m.createdAt, store.device.language)}</Txt><Button secondary title={t('review')} onPress={() => router.push({ pathname: '/measurement', params: { id: m.id, customerId: c.id } })}/>{!c.archived && availableTemplate(store.data, shop.id)?.id === template.id && <Button secondary title={t('copyMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId: c.id, sourceId: m.id } })}/>}</Card>; })}<Txt title>{t('orderHistory')}</Txt>{store.data.orders.filter(o => o.customerId === c.id).map(o => <Card key={o.id}><Txt>{o.orderNumber} · {t(o.status)}</Txt><Button secondary title={t('orderSummary')} onPress={() => router.push({ pathname: '/order', params: { id: o.id } })}/></Card>)}{!c.archived && <><Button secondary title={t('archive')} onPress={() => setConfirm(true)}/>{confirm && <Card><Txt>{t('archiveConfirm')}</Txt><Button title={t('confirm')} onPress={async () => { try {
    const next = structuredClone(store.data);
    Object.assign(next.customers.find(i => i.id === c.id)!, { archived: true, recordVersion: c.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
    await store.commit(next);
    setConfirm(false);
}
catch (e) {
    setError((e as Error).message);
} }}/><Button secondary title={t('cancel')} onPress={() => setConfirm(false)}/></Card>}</>}<Notice error={error}/></Screen>; }

