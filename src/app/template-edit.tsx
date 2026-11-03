import React, { useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type Field, type FieldType, type Value } from '../domain/model';
import { saveTemplate } from '../domain/services';
import { validateFields } from '../domain/validation';
import { useI18n, useShop, useStore } from '../store';
import { label } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';
import { Button, Card, Choice, Input, Notice, Row, Screen, Toggle, Txt } from '../components/ui';
import { DynamicForm } from '../components/DynamicForm';
export default function TemplateEditor() {
    const { id, copy, preview } = useLocalSearchParams<{
        id?: string;
        copy?: string;
        preview?: string;
    }>();
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const template = store.data.templates.find(t => t.id === (id ?? copy) && t.shopId === shop.id);
    const current = store.data.templateVersions.find(v => v.templateId === template?.id && v.version === template?.activeVersion);
    const [name] = useState(template ? `${template.name}${copy ? ' (copy)' : ''}` : '');
    const [ur] = useState(template?.labels.ur ?? '');
    const [fields, setFields] = useState<Field[]>(structuredClone(current?.fields ?? []));
    const [field, setField] = useState<Field | null>(null);
    const [showPreview, setShowPreview] = useState(preview === '1');
    const [values, setValues] = useState<Record<string, Value>>({});
    const [error, setError] = useState('');
    function move(index: number, direction: number) { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length)
        return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((f, order) => ({ ...f, order }))); }
    function newField() { setError(''); setField({ id: store.ctx.id(), fieldKey: '', labels: { en: '', ur: '' }, type: 'decimal', required: false, enabled: true, order: fields.length, unit: shop.defaultUnit, options: [], helperText: '' }); }
    if (!id || copy || !template || template.id !== availableTemplate(store.data, shop.id)?.id) return <Redirect href="/templates"/>;
    if (field)
        return <Screen title={t('addField')}><Input label={t('fieldKey')} value={field.fieldKey} onChange={v => setField({ ...field, fieldKey: v })}/><Input label={t('fieldLabel')} value={field.labels.en} onChange={v => setField({ ...field, labels: { ...field.labels, en: v } })}/><Input label={t('urduLabel')} value={field.labels.ur ?? ''} onChange={v => setField({ ...field, labels: { ...field.labels, ur: v } })}/><Txt>{t('fieldType')}</Txt><Choice value={field.type} options={['decimal', 'integer', 'text', 'multiline', 'select', 'radio', 'checkbox', 'date'].map(type => ({ value: type, label: t(type) }))} onChange={v => setField({ ...field, type: v as FieldType, unit: ['decimal', 'integer'].includes(v) ? field.unit : undefined, defaultValue: undefined })}/><Toggle title={t('requiredFlag')} value={field.required} onChange={v => setField({ ...field, required: v })}/><Toggle title={t('enabled')} value={field.enabled} onChange={v => setField({ ...field, enabled: v })}/>{['decimal', 'integer'].includes(field.type) && <><Txt>{t('unit')}</Txt><Choice value={field.unit ?? ''} options={['', 'inch', 'cm'].map(v => ({ value: v, label: t(v || 'none') }))} onChange={v => setField({ ...field, unit: v ? v as 'inch' | 'cm' : undefined })}/><Input label={t('minimum')} value={field.min === undefined ? '' : String(field.min)} numeric onChange={v => setField({ ...field, min: v === '' ? undefined : Number(v) })}/><Input label={t('maximum')} value={field.max === undefined ? '' : String(field.max)} numeric onChange={v => setField({ ...field, max: v === '' ? undefined : Number(v) })}/></>}{['select', 'radio'].includes(field.type) && <Input label={t('options')} multiline value={field.options.join('\n')} onChange={v => setField({ ...field, options: v.split('\n') })}/>}<Input label={t('helper')} value={field.helperText} onChange={v => setField({ ...field, helperText: v })}/>{field.type === 'checkbox' ? <Toggle title={t('defaultValue')} value={field.defaultValue === true} onChange={v => setField({ ...field, defaultValue: v })}/> : <Input label={t('defaultValue')} value={String(field.defaultValue ?? '')} onChange={v => setField({ ...field, defaultValue: v })}/>}<Notice error={error}/><Button title={t('save')} onPress={() => { try {
            const result = fields.some(f => f.id === field.id) ? fields.map(f => f.id === field.id ? field : f) : [...fields, field];
            validateFields(result);
            setFields(result);
            setField(null);
            setError('');
        }
        catch (e) {
            setError((e as Error).message);
        } }}/><Button secondary title={t('cancel')} onPress={() => { setField(null); setError(''); }}/></Screen>;
    return <Screen title={t(showPreview ? 'previewTemplate' : 'templates')}><Txt title>{label(template.labels, store.device.language)}</Txt><Txt muted>{t('historyNotice')}</Txt>{showPreview ? <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={fields} values={values} onChange={(k, v) => setValues({ ...values, [k]: v })}/> : fields.map((f, i) => <Card key={f.id}><Txt>{label(f.labels, store.device.language)} {f.required ? '*' : ''}</Txt><Txt muted>{f.fieldKey} · {t(f.type)} · {f.unit ? t(f.unit) : ''}</Txt><Toggle title={t('enabled')} value={f.enabled} onChange={v => setFields(fields.map(item => item.id === f.id ? { ...item, enabled: v } : item))}/><Row><Button secondary title={t('edit')} onPress={() => setField(structuredClone(f))}/><Button secondary title="↑" disabled={i === 0} onPress={() => move(i, -1)}/><Button secondary title="↓" disabled={i === fields.length - 1} onPress={() => move(i, 1)}/><Button secondary title={t('remove')} onPress={() => setFields(fields.filter(item => item.id !== f.id).map((f, order) => ({ ...f, order })))}/></Row></Card>)}{!showPreview && <Button secondary title={`＋ ${t('addField')}`} onPress={newField}/>}<Button secondary title={t(showPreview ? 'edit' : 'preview')} onPress={() => setShowPreview(!showPreview)}/><Notice error={error}/><Button title={t('saveVersion')} onPress={async () => { try {
        const next = saveTemplate(store.data, store.ctx, shop.id, name, ur, fields, id);
        await store.commit(next);
        router.replace('/templates');
    }
    catch (e) {
        setError((e as Error).message);
    } }}/></Screen>;
}

