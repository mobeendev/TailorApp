import React from 'react';
import { View } from 'react-native';
import { Ruler } from 'lucide-react-native';
import { GarmentIcon } from './GarmentIcon';
import { type Field, type Value } from '../domain/model';
import { optionName } from '../domain/displayNames';
import { label, rtl } from '../localization';
import { useI18n, useStore } from '../store';
import { Card, Choice, Input, Toggle, Txt, useColors } from './ui';
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
    const labelHeight = 2 * (device.language === 'ur' ? 18 : 16);
    const enabled = fields.filter(f => f.enabled).sort((a, b) => a.order - b.order);
    const sections: { title?: string; icon?: 'kameez' | 'shalwar' | 'other'; fields: Field[] }[] = garmentSections ? [
        { title: t('recordDetails'), icon: 'other', fields: enabled.filter(f => referenceKeys.has(f.fieldKey)) },
        { title: t('kameezSection'), icon: 'kameez', fields: enabled.filter(f => kameezKeys.has(f.fieldKey)) },
        { title: t('shalwarSection'), icon: 'shalwar', fields: enabled.filter(f => shalwarKeys.has(f.fieldKey)) },
        { title: t('styleDetails'), icon: 'other', fields: enabled.filter(f => detailKeys.has(f.fieldKey)) },
        { title: t('otherFieldsSection'), icon: 'other', fields: enabled.filter(f => !referenceKeys.has(f.fieldKey) && !kameezKeys.has(f.fieldKey) && !shalwarKeys.has(f.fieldKey) && !detailKeys.has(f.fieldKey)) },
    ] : [{ fields: enabled }];

    return <>{sections.filter(section => section.fields.length > 0).map((section, index) => {
        return <Card compact key={section.title ?? index}>
            {section.title && <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <View accessibilityElementsHidden importantForAccessibility="no">{section.icon === 'other' ? <Ruler size={20} color={colors.green}/> : section.icon && <GarmentIcon garment={section.icon} color={colors.green}/>}</View><Txt title>{section.title}</Txt>
            </View>}
            {/* Fixed-width grid: cells never stretch, so every row lines up with the columns above it. */}
            <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', flexWrap: 'wrap', marginHorizontal: -5, rowGap: 12 }}>
                {section.fields.map(f => {
                    const title = `${label(f.labels, device.language, f.fieldKey)}${f.required ? ' *' : ''}${f.unit ? ` (${t(f.unit)})` : ''}`;
                    const value = values[f.fieldKey];
                    const fullWidth = ['select', 'radio', 'checkbox', 'multiline'].includes(f.type);
                    const halfWidth = !fullWidth && (referenceKeys.has(f.fieldKey) || f.type === 'date');
                    const error = errors[f.fieldKey] ? t(errors[f.fieldKey]) : undefined;
                    const shown = value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? '☑' : '☐') : f.type === 'date' ? formatDay(String(value), device.language) || String(value) : optionName(String(value), device.language, f.fieldKey);
                    return <View key={f.id} style={{ width: fullWidth ? '100%' : halfWidth ? '50%' : '33.3333%', paddingHorizontal: 5, gap: 4 }}>
                        {readOnly ? <><Text numberOfLines={2} style={{ fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: isRtl ? 'right' : 'left', minHeight: fullWidth ? undefined : labelHeight }}>{title}</Text><Txt>{shown}</Txt></>
                            : f.type === 'checkbox' ? <Toggle title={title} value={value === true} onChange={v => onChange(f.fieldKey, v)}/>
                            : ['select', 'radio'].includes(f.type) ? <><Txt>{title}</Txt><Choice value={String(value ?? '')} options={f.options.map(o => ({ value: o, label: optionName(o, device.language, f.fieldKey) }))} onChange={v => onChange(f.fieldKey, v)}/></>
                            : f.type === 'date' ? <DateField label={title} labelLines={2} value={String(value ?? '')} onChange={v => onChange(f.fieldKey, v)} error={error}/>
                            : <Input label={title} labelLines={fullWidth ? undefined : 2} value={String(value ?? '')} onChange={v => onChange(f.fieldKey, v)} numeric={['decimal', 'integer'].includes(f.type) || f.fieldKey === 'serial_number'} multiline={f.type === 'multiline'} error={error}/>}
                        {f.helperText ? <Txt muted>{f.helperText}</Txt> : null}{['select', 'radio', 'checkbox'].includes(f.type) && error ? <Txt>{error}</Txt> : null}
                    </View>;
                })}
            </View>
        </Card>;
    })}</>;
}
