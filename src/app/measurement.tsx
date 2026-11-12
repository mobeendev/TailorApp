import { displayTimestamp } from '../domain/displayNames';
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { type Value } from '../domain/model';
import { saveMeasurement } from '../domain/services';
import { validateValues } from '../domain/validation';
import { copyMeasurement, measurementHistory, measurementVersion } from '../domain/measurementHistory';
import { useI18n, useShop, useStore } from '../store';
import { label } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';
import { withRecordDefaults } from '../domain/recordDefaults';
import { Button, Card, Notice, Pair, Screen, Txt } from '../components/ui';
import { DynamicForm } from '../components/DynamicForm';
export default function Measurement() {
    const { id, customerId, sourceId, returnToOrder } = useLocalSearchParams<{ id?: string; customerId: string; sourceId?: string; returnToOrder?: string }>();
    const store = useStore(); const shop = useShop()!; const t = useI18n();
    const existing = store.data.measurements.find(m => m.id === id && m.customerId === customerId && m.shopId === shop.id);
    const available = availableTemplate(store.data, shop.id);
    const [draft] = useState(() => {
        if (!sourceId || id || store.data.measurements.find(m => m.id === sourceId)?.templateId !== available?.id) return null;
        try { return copyMeasurement(store.data, shop.id, customerId, sourceId); } catch { return null; }
    });
    const [templateId] = useState(existing?.templateId ?? draft?.templateId ?? available?.id ?? '');
    const template = available?.id === templateId ? available : undefined;
    const version = existing ? measurementVersion(store.data, existing) : store.data.templateVersions.find(v => v.templateId === templateId && v.version === template?.activeVersion && v.shopId === shop.id);
    const defaults = Object.fromEntries(version?.fields.filter(f => f.enabled && f.defaultValue !== undefined).map(f => [f.fieldKey, f.defaultValue!]) ?? []);
    // New records get the next serial number and today's date; saved records are shown exactly as stored.
    const [values, setValues] = useState<Record<string, Value>>(() => existing?.values ?? withRecordDefaults(version?.fields ?? [], draft?.values ?? defaults, store.data, shop.id));
    const [copied, setCopied] = useState(draft);
    const [confirmCopy, setConfirmCopy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState(sourceId && !draft && !existing ? 'copyUnavailable' : '');
    const [review, setReview] = useState(Boolean(existing));
    const latest = measurementHistory(store.data, shop.id, customerId, templateId)[0];
    function copyLatest() {
        try {
            const result = copyMeasurement(store.data, shop.id, customerId, latest.id);
            setValues(withRecordDefaults(result.target.fields, result.values, store.data, shop.id)); setCopied(result); setErrors({}); setError(''); setDirty(false); setConfirmCopy(false);
        } catch { setError('copyUnavailable'); }
    }
    if ((id && !existing) || !store.data.customers.some(c => c.id === customerId && c.shopId === shop.id)) return <Screen title={t('measurement')}><Txt>{t('notFound')}</Txt></Screen>;
    return <Screen compact key={String(review)} title={t('measurement')}>
        <Txt title>{store.data.customers.find(c => c.id === customerId)?.name}</Txt><Txt muted>{t('unitNotice')}</Txt>
        {!existing && template && <Txt>{label(template.labels, store.device.language)}</Txt>}
        {!existing && !review && latest && <Button secondary title={t('copyLatestMeasurement')} onPress={() => dirty ? setConfirmCopy(true) : copyLatest()}/>}
        {confirmCopy && <Card><Txt>{t('replaceMeasurementDraft')}</Txt><Button title={t('confirm')} onPress={copyLatest}/><Button secondary title={t('cancel')} onPress={() => setConfirmCopy(false)}/></Card>}
        {copied && <Card><Txt>{t('measurementCopied')}</Txt><Txt muted>{displayTimestamp(copied.source.createdAt, store.device.language)} · {t('version')} {copied.source.templateVersion} → {copied.target.version}</Txt><Txt>{t('fieldsCopied')}: {copied.copied} · {t('fieldsSkipped')}: {copied.skipped}</Txt><Txt muted>{t('copyMeasurementHint')}</Txt></Card>}
        <Button secondary title={t('guide')} onPress={() => router.push('/guide')}/>
        {version ? <><Txt>{t('version')} {version.version}</Txt><DynamicForm garmentSections={store.data.templates.find(item => item.id === templateId)?.systemKey === 'shalwar-kameez'} fields={version.fields} values={values} onChange={(k, v) => { setValues({ ...values, [k]: v }); setDirty(true); }} errors={errors} readOnly={review}/></> : <Txt>{t('templateRequired')}</Txt>}
        <Notice error={error}/>
        {!existing && version && (review ? <><Pair><Button secondary title={t('edit')} onPress={() => setReview(false)}/><Button title={t('saveMeasurement')} onPress={async () => {
            try { const result = saveMeasurement(store.data, store.ctx, shop.id, customerId, templateId, values); await store.commit(result.state); if (returnToOrder === '1') router.dismissTo({ pathname: '/order-edit', params: { customerId, measurementId: result.measurementId } }); else router.replace({ pathname: '/customer', params: { id: customerId } }); }
            catch (e) { setError((e as Error).message); }
        }}/></Pair></> : <Button title={t('review')} onPress={() => { const e = validateValues(version.fields, values); setErrors(e); if (!Object.keys(e).length) setReview(true); }}/>) }
        {existing && <>{template && <Button title={t('copyMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId, sourceId: existing.id } })}/>}<Button secondary title={t('compareMeasurements')} onPress={() => router.push({ pathname: '/measurement-compare', params: { customerId, templateId: existing.templateId, newId: existing.id } })}/></>}
    </Screen>;
}
