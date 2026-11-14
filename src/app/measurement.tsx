import { displayTimestamp } from '../domain/displayNames';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftRight, BookOpen, ClipboardCheck, Copy, Pencil, Save } from 'lucide-react-native';
import { type Value } from '../domain/model';
import { saveMeasurement } from '../domain/services';
import { validateValues } from '../domain/validation';
import { copyMeasurement, measurementHistory, measurementVersion } from '../domain/measurementHistory';
import { useI18n, useShop, useStore } from '../store';
import { label, rtl } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';
import { withRecordDefaults } from '../domain/recordDefaults';
import { Avatar, Button, Card, EmptyState, Notice, Pair, Screen, Txt } from '../components/ui';
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
    if ((id && !existing) || !store.data.customers.some(c => c.id === customerId && c.shopId === shop.id)) return <Screen title={t('measurement')}><EmptyState title={t('notFound')}/></Screen>;
    const name = store.data.customers.find(c => c.id === customerId)?.name ?? '';
    const subtitle = [!existing && template ? label(template.labels, store.device.language) : '', version ? `${t('version')} ${version.version}` : ''].filter(Boolean).join(' · ');
    return <Screen compact key={String(review)} title={t('measurement')}>
        <Card compact>
            <View style={{ flexDirection: rtl(store.device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}><Avatar name={name}/><View style={{ flex: 1, gap: 2 }}><Txt heading>{name}</Txt>{subtitle ? <Txt muted>{subtitle}</Txt> : null}</View></View>
            <Txt muted>{t('unitNotice')}</Txt>
            <Pair>{!existing && !review && latest && <Button secondary compact icon={Copy} title={t('copyLatestMeasurement')} onPress={() => dirty ? setConfirmCopy(true) : copyLatest()}/>}<Button secondary compact icon={BookOpen} title={t('guide')} onPress={() => router.push('/guide')}/></Pair>
        </Card>
        {confirmCopy && <Card compact><Notice info="replaceMeasurementDraft"/><Pair><Button secondary title={t('cancel')} onPress={() => setConfirmCopy(false)}/><Button icon={Copy} title={t('confirm')} onPress={copyLatest}/></Pair></Card>}
        {copied && <Card compact><Notice success="measurementCopied"/><Txt muted>{displayTimestamp(copied.source.createdAt, store.device.language)} · {t('version')} {copied.source.templateVersion} → {copied.target.version}</Txt><Txt>{t('fieldsCopied')}: {copied.copied} · {t('fieldsSkipped')}: {copied.skipped}</Txt><Txt muted>{t('copyMeasurementHint')}</Txt></Card>}
        {version ? <DynamicForm garmentSections={store.data.templates.find(item => item.id === templateId)?.systemKey === 'shalwar-kameez'} fields={version.fields} values={values} onChange={(k, v) => { setValues({ ...values, [k]: v }); setDirty(true); }} errors={errors} readOnly={review}/> : <Notice error="templateRequired"/>}
        <Notice error={error}/>
        {!existing && version && (review ? <Pair><Button secondary icon={Pencil} title={t('edit')} onPress={() => setReview(false)}/><Button icon={Save} title={t('saveMeasurement')} onPress={async () => {
            try { const result = saveMeasurement(store.data, store.ctx, shop.id, customerId, templateId, values); await store.commit(result.state); if (returnToOrder === '1') router.dismissTo({ pathname: '/order-edit', params: { customerId, measurementId: result.measurementId } }); else router.replace({ pathname: '/customer', params: { id: customerId } }); }
            catch (e) { setError((e as Error).message); }
        }}/></Pair> : <Button icon={ClipboardCheck} title={t('review')} onPress={() => { const e = validateValues(version.fields, values); setErrors(e); if (!Object.keys(e).length) setReview(true); }}/>) }
        {existing && <>{template && <Button icon={Copy} title={t('copyMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId, sourceId: existing.id } })}/>}<Button secondary icon={ArrowLeftRight} title={t('compareMeasurements')} onPress={() => router.push({ pathname: '/measurement-compare', params: { customerId, templateId: existing.templateId, newId: existing.id } })}/></>}
    </Screen>;
}
