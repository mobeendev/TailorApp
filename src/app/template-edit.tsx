import React, { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Save, Trash2 } from 'lucide-react-native';
import { type Field, type FieldType, type Value } from '../domain/model';
import { saveTemplate } from '../domain/services';
import { validateFields } from '../domain/validation';
import { useI18n, useShop, useStore } from '../store';
import { label, rtl } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';
import { Button, Card, Choice, FieldLabel, IconButton, Input, Notice, Pair, Screen, Toggle, Txt } from '../components/ui';
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
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    function move(index: number, direction: number) { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length)
        return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((f, order) => ({ ...f, order }))); }
    function newField() { setError(''); setField({ id: store.ctx.id(), fieldKey: '', labels: { en: '', ur: '' }, type: 'decimal', required: false, enabled: true, order: fields.length, unit: shop.defaultUnit, options: [], helperText: '' }); }
    if (!id || copy || !template || template.id !== availableTemplate(store.data, shop.id)?.id) return <Redirect href="/templates"/>;
    if (field)
        return <Screen title={t('addField')}><Card><Input label={t('fieldKey')} value={field.fieldKey} autoCapitalize="none" onChange={v => setField({ ...field, fieldKey: v })}/><Input label={t('fieldLabel')} value={field.labels.en} onChange={v => setField({ ...field, labels: { ...field.labels, en: v } })}/><Input label={t('urduLabel')} value={field.labels.ur ?? ''} onChange={v => setField({ ...field, labels: { ...field.labels, ur: v } })}/></Card>
        <Card><View style={{ gap: 8 }}><FieldLabel>{t('fieldType')}</FieldLabel><Choice value={field.type} options={['decimal', 'integer', 'text', 'multiline', 'select', 'radio', 'checkbox', 'date'].map(type => ({ value: type, label: t(type) }))} onChange={v => setField({ ...field, type: v as FieldType, unit: ['decimal', 'integer'].includes(v) ? field.unit : undefined, defaultValue: undefined })}/></View><Toggle title={t('requiredFlag')} value={field.required} onChange={v => setField({ ...field, required: v })}/><Toggle title={t('enabled')} value={field.enabled} onChange={v => setField({ ...field, enabled: v })}/>{['decimal', 'integer'].includes(field.type) && <><View style={{ gap: 8 }}><FieldLabel>{t('unit')}</FieldLabel><Choice value={field.unit ?? ''} options={['', 'inch', 'cm'].map(v => ({ value: v, label: t(v || 'none') }))} onChange={v => setField({ ...field, unit: v ? v as 'inch' | 'cm' : undefined })}/></View><Pair><Input label={t('minimum')} value={field.min === undefined ? '' : String(field.min)} numeric onChange={v => setField({ ...field, min: v === '' ? undefined : Number(v) })}/><Input label={t('maximum')} value={field.max === undefined ? '' : String(field.max)} numeric onChange={v => setField({ ...field, max: v === '' ? undefined : Number(v) })}/></Pair></>}{['select', 'radio'].includes(field.type) && <Input label={t('options')} multiline value={field.options.join('\n')} onChange={v => setField({ ...field, options: v.split('\n') })}/>}<Input label={t('helper')} value={field.helperText} onChange={v => setField({ ...field, helperText: v })}/>{field.type === 'checkbox' ? <Toggle title={t('defaultValue')} value={field.defaultValue === true} onChange={v => setField({ ...field, defaultValue: v })}/> : <Input label={t('defaultValue')} value={String(field.defaultValue ?? '')} onChange={v => setField({ ...field, defaultValue: v })}/>}</Card><Notice error={error}/><Pair><Button secondary title={t('cancel')} onPress={() => { setField(null); setError(''); }}/><Button icon={Save} title={t('save')} onPress={() => { try {
            const result = fields.some(f => f.id === field.id) ? fields.map(f => f.id === field.id ? field : f) : [...fields, field];
            validateFields(result);
            setFields(result);
            setField(null);
            setError('');
        }
        catch (e) {
            setError((e as Error).message);
        } }}/></Pair></Screen>;
    return <Screen title={t(showPreview ? 'previewTemplate' : 'templates')}><Txt title>{label(template.labels, store.device.language)}</Txt><Notice info="historyNotice"/><Button secondary icon={showPreview ? Pencil : Eye} title={t(showPreview ? 'edit' : 'preview')} onPress={() => setShowPreview(!showPreview)}/>{showPreview ? <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={fields} values={values} onChange={(k, v) => setValues({ ...values, [k]: v })}/> : fields.map((f, i) => <Card compact key={f.id}>
        <View style={{ gap: 4 }}><Txt strong>{label(f.labels, store.device.language)} {f.required ? '*' : ''}</Txt><Txt muted>{f.fieldKey} · {t(f.type)}{f.unit ? ` · ${t(f.unit)}` : ''}</Txt></View>
        <Toggle title={t('enabled')} value={f.enabled} onChange={v => setFields(fields.map(item => item.id === f.id ? { ...item, enabled: v } : item))}/>
        <View style={{ flexDirection: dir, gap: 8, alignItems: 'center' }}><View style={{ flex: 1 }}><Button secondary compact icon={Pencil} title={t('edit')} onPress={() => setField(structuredClone(f))}/></View><IconButton icon={ArrowUp} label={t('moveUp')} disabled={i === 0} onPress={() => move(i, -1)}/><IconButton icon={ArrowDown} label={t('moveDown')} disabled={i === fields.length - 1} onPress={() => move(i, 1)}/><IconButton tone="danger" icon={Trash2} label={t('remove')} onPress={() => setFields(fields.filter(item => item.id !== f.id).map((f, order) => ({ ...f, order })))}/></View>
    </Card>)}{!showPreview && <Button secondary icon={Plus} title={t('addField')} onPress={newField}/>}<Notice error={error}/><Button icon={Save} title={t('saveVersion')} onPress={async () => { try {
        const next = saveTemplate(store.data, store.ctx, shop.id, name, ur, fields, id);
        await store.commit(next);
        router.replace('/templates');
    }
    catch (e) {
        setError((e as Error).message);
    } }}/></Screen>;
}
