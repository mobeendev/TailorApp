import React from 'react';
import { View } from 'react-native';
import { ClipboardList, Ruler } from 'lucide-react-native';
import { GarmentIcon } from './GarmentIcon';
import { type Field, type Value } from '../domain/model';
import { optionName } from '../domain/displayNames';
import { label, rtl } from '../localization';
import { useI18n, useStore } from '../store';
import { Card, Choice, FieldError, FieldLabel, IconWell, Input, Toggle, Txt, useColors } from './ui';
import { Text } from './AppText';
import { DateField, formatDay } from './Calendar';

const kameezKeys = new Set(['length', 'chest', 'shoulder', 'sleeve', 'neck', 'collar', 'cuff', 'waist', 'hip', 'pockets', 'shirt_length', 'waistcoat_length', 'ghera', 'collar_band']);
const referenceKeys = new Set(['serial_number', 'measurement_date']);
const detailKeys = new Set(['front', 'side', 'hip_detail', 'plate']);
const shalwarKeys = new Set(['shalwar_length', 'shalwar_waist', 'bottom', 'thigh', 'knee', 'style']);

export function DynamicForm({ fields, values, onChange, errors = {}, readOnly = false, garmentSections = false }: {
    fields: Field[];
    values: Record<string, Value>;
    onChange: (key: string, value: Value) => void;
    errors?: Record<string, string>;
    readOnly?: boolean;
    garmentSections?: boolean;
}) {
    const { device } = useStore();
    const t = useI18n();
    const colors = useColors();
    const isRtl = rtl(device.language);
    const enabled = fields.filter(f => f.enabled).sort((a, b) => a.order - b.order);
    const sections: { title?: string; icon?: 'kameez' | 'shalwar' | 'record' | 'other'; fields: Field[] }[] = garmentSections ? [
        { title: t('recordDetails'), icon: 'record', fields: enabled.filter(f => referenceKeys.has(f.fieldKey)) },
        { title: t('kameezSection'), icon: 'kameez', fields: enabled.filter(f => kameezKeys.has(f.fieldKey)) },
        { title: t('shalwarSection'), icon: 'shalwar', fields: enabled.filter(f => shalwarKeys.has(f.fieldKey)) },
        { title: t('styleDetails'), icon: 'other', fields: enabled.filter(f => detailKeys.has(f.fieldKey)) },
        { title: t('otherFieldsSection'), icon: 'other', fields: enabled.filter(f => !referenceKeys.has(f.fieldKey) && !kameezKeys.has(f.fieldKey) && !shalwarKeys.has(f.fieldKey) && !detailKeys.has(f.fieldKey)) },
    ] : [{ fields: enabled }];

    return <>{sections.filter(section => section.fields.length > 0).map((section, index) => {
        return <Card compact key={section.title ?? index}>
            {section.title && <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
                {section.icon === 'kameez' || section.icon === 'shalwar' ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}><GarmentIcon garment={section.icon} color={colors.green} size={30}/></View> : <IconWell icon={section.icon === 'record' ? ClipboardList : Ruler}/>}
                <View style={{ flex: 1 }}><Txt heading>{section.title}</Txt></View>
            </View>}
            {/* Fixed-width grid: cells never stretch, so every row lines up with the columns above it. */}
            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap', marginHorizontal: -5, rowGap: 14 }}>
                {section.fields.map(f => {
                    const title = `${label(f.labels, device.language, f.fieldKey)}${f.required ? ' *' : ''}${f.unit ? ` (${t(f.unit)})` : ''}`;
                    const value = values[f.fieldKey];
                    const fullWidth = ['select', 'radio', 'checkbox', 'multiline'].includes(f.type);
                    const halfWidth = !fullWidth && (referenceKeys.has(f.fieldKey) || f.type === 'date');
                    const error = errors[f.fieldKey] ? t(errors[f.fieldKey]) : undefined;
                    const empty = value === undefined || value === '';
                    const shown = empty ? '—' : typeof value === 'boolean' ? t(value ? 'yes' : 'no') : f.type === 'date' ? formatDay(String(value), device.language) || String(value) : optionName(String(value), device.language, f.fieldKey);
                    return <View key={f.id} style={{ width: fullWidth ? '100%' : halfWidth ? '50%' : '33.3333%', paddingHorizontal: 5, gap: 6 }}>
                        {readOnly ? <View style={{ backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, gap: 2, flexGrow: 1, justifyContent: 'space-between' }}>
                            {/* Saved values: no required mark, and the unit follows the number so the label stays short. */}
                            <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: colors.muted, textAlign: isRtl ? 'right' : 'left' }}>{label(f.labels, device.language, f.fieldKey)}</Text>
                            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 4 }}><Text style={{ fontSize: 18, lineHeight: 25, fontWeight: '700', color: empty ? colors.faint : colors.ink, textAlign: isRtl ? 'right' : 'left', fontVariant: ['tabular-nums'] }}>{shown}</Text>{!empty && f.unit ? <Text style={{ fontSize: 13, color: colors.muted }}>{t(f.unit)}</Text> : null}</View>
                        </View>
                            : f.type === 'checkbox' ? <Toggle title={title} value={value === true} onChange={v => onChange(f.fieldKey, v)}/>
                            : ['select', 'radio'].includes(f.type) ? <><FieldLabel>{title}</FieldLabel><Choice value={String(value ?? '')} options={f.options.map(o => ({ value: o, label: optionName(o, device.language, f.fieldKey) }))} onChange={v => onChange(f.fieldKey, v)}/></>
                            : f.type === 'date' ? <DateField label={title} labelLines={2} value={String(value ?? '')} onChange={v => onChange(f.fieldKey, v)} error={error}/>
                            : <Input label={title} labelLines={fullWidth ? undefined : 2} value={String(value ?? '')} onChange={v => onChange(f.fieldKey, v)} numeric={['decimal', 'integer'].includes(f.type) || f.fieldKey === 'serial_number'} multiline={f.type === 'multiline'} error={error}/>}
                        {f.helperText ? <Txt muted>{f.helperText}</Txt> : null}{['select', 'radio', 'checkbox'].includes(f.type) && error ? <FieldError>{error}</FieldError> : null}
                    </View>;
                })}
            </View>
        </Card>;
    })}</>;
}
