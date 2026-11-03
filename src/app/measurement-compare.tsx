import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import type { Unit, Value } from '../domain/model';
import { compareMeasurements, measurementHistory } from '../domain/measurementHistory';
import { useI18n, useShop, useStore } from '../store';
import { optionName, displayTimestamp } from '../domain/displayNames';
import { label } from '../localization';
import { Card, Choice, Screen, Toggle, Txt } from '../components/ui';
export default function MeasurementCompare() {
    const params = useLocalSearchParams<{ customerId: string; templateId?: string; newId?: string }>();
    const { data, device } = useStore(); const shop = useShop()!; const t = useI18n();
    const history = measurementHistory(data, shop.id, params.customerId);
    const templates = data.templates.filter(v => v.shopId === shop.id && history.some(m => m.templateId === v.id));
    const [templateId, setTemplateId] = useState(params.templateId ?? history[0]?.templateId ?? '');
    const matching = history.filter(m => m.templateId === templateId);
    const initialNew = matching.find(m => m.id === params.newId) ?? matching[0];
    const [newId, setNewId] = useState(initialNew?.id ?? '');
    const [oldId, setOldId] = useState(matching.find(m => m.id !== initialNew?.id)?.id ?? '');
    const [onlyChanged, setOnlyChanged] = useState(false);
    const customer = data.customers.find(c => c.shopId === shop.id && c.id === params.customerId);
    function value(v: Value | undefined, unit: Unit | undefined, fieldKey: string) {
        if (v === undefined || v === '') return '—';
        return `${typeof v === 'boolean' ? t(v ? 'yes' : 'no') : optionName(String(v), device.language, fieldKey)}${unit ? ` ${t(unit)}` : ''}`;
    }
    const options = matching.map(m => ({ value: m.id, label: `${displayTimestamp(m.createdAt, device.language)} · ${t('version')} ${m.templateVersion} · ${m.id.slice(-4)}` }));
    const rows = matching.some(m => m.id === oldId) && matching.some(m => m.id === newId) && oldId !== newId ? compareMeasurements(data, shop.id, params.customerId, oldId, newId) : [];
    if (!customer) return <Screen title={t('compareMeasurements')}><Txt>{t('notFound')}</Txt></Screen>;
    return <Screen title={t('compareMeasurements')}><Txt title>{customer.name}</Txt>
        <Choice value={templateId} options={templates.map(v => ({ value: v.id, label: label(v.labels, device.language) }))} onChange={id => { const records = history.filter(m => m.templateId === id); setTemplateId(id); setNewId(records[0]?.id ?? ''); setOldId(records[1]?.id ?? ''); }}/>
        {matching.length < 2 ? <Card><Txt>{t('needTwoMeasurements')}</Txt></Card> : <>
            <Txt>{t('beforeMeasurement')}</Txt><Choice value={oldId} options={options.filter(o => o.value !== newId)} onChange={setOldId}/>
            <Txt>{t('afterMeasurement')}</Txt><Choice value={newId} options={options.filter(o => o.value !== oldId)} onChange={setNewId}/>
            <Txt muted>{t('comparisonHint')}</Txt><Toggle title={t('onlyChangedFields')} value={onlyChanged} onChange={setOnlyChanged}/>
            <Txt>{t('changedFields')}: {rows.filter(r => r.changed).length} {t('of')} {rows.length}</Txt>
            {onlyChanged && !rows.some(r => r.changed) && <Card><Txt>{t('noMeasurementChanges')}</Txt></Card>}
            {rows.filter(r => !onlyChanged || r.changed).map(row => <Card key={row.field.fieldKey}>
                <Txt title>{label(row.field.labels, device.language)}</Txt>
                <View style={{ flexDirection: device.language === 'en' ? 'row' : 'row-reverse', gap: 16 }}>
                    <View style={{ flex: 1 }}><Txt muted>{t('beforeMeasurement')}</Txt><Txt>{value(row.before, row.beforeUnit, row.field.fieldKey)}</Txt>{!row.oldField && <Txt muted>{t('fieldAbsent')}</Txt>}</View>
                    <View style={{ flex: 1 }}><Txt muted>{t('afterMeasurement')}</Txt><Txt>{value(row.after, row.afterUnit, row.field.fieldKey)}</Txt>{!row.newField && <Txt muted>{t('fieldAbsent')}</Txt>}</View>
                </View>
                <Txt>{t(row.changed ? 'measurementChanged' : 'measurementUnchanged')}{row.delta !== null ? ` · \u2066${row.delta > 0 ? '+' : ''}${row.delta}\u2069${row.afterUnit ? ` ${t(row.afterUnit)}` : ''}` : ''}</Txt>
            </Card>)}
        </>}
    </Screen>;
}
