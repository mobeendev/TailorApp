import { type Context, type Field, type Template, type TemplateVersion, type Unit, meta } from './model.ts';
const definitions: Record<string, [
    string,
    string,
    boolean
]> = {
    serial_number: ['Serial Number', 'سیریل نمبر', false], measurement_date: ['Date', 'تاریخ', false], shirt_length: ['Shirt Length', 'شرٹ', false], waistcoat_length: ['Waistcoat Length', 'ویس کوٹ', false], front: ['Front', 'فرنٹ', false], side: ['Side', 'سائیڈ', false], hip_detail: ['Hip (detail)', 'ہپ', false], collar_band: ['Collar / Band', 'کالر بین', false], plate: ['Pleat', 'پلیٹ', false],
    length: ['Kameez Length', 'قمیض کی لمبائی', true], chest: ['Chest', 'چھاتی', true], shoulder: ['Shoulder', 'تیرا', true], sleeve: ['Sleeve Length', 'بازو', true], neck: ['Neck Size', 'گلہ', false], collar: ['Collar Style', 'کالر', false], cuff: ['Cuff', 'کف', false], waist: ['Waist', 'کمر', false], hip: ['Hip', 'کولہا', false], shalwar_length: ['Shalwar Length', 'شلوار کی لمبائی', true], shalwar_waist: ['Shalwar Waist', 'شلوار کی کمر', false], bottom: ['Bottom Opening', 'پائنچہ', false], ghera: ['Ghera', 'گھیرا', false], thigh: ['Thigh', 'ران', false], knee: ['Knee', 'گھٹنا', false], style: ['Style', 'انداز', false], notes: ['Special Instructions', 'خاص ہدایات', false], pockets: ['Number of Pockets', 'جیبوں کی تعداد', false],
};
export const library = [
    { key: 'shalwar-kameez', en: 'Shalwar Kameez', ur: 'شلوار قمیض', icon: '♧', keys: ['serial_number', 'measurement_date', 'length', 'shirt_length', 'waistcoat_length', 'sleeve', 'shoulder', 'neck', 'chest', 'waist', 'ghera', 'hip', 'shalwar_length', 'shalwar_waist', 'bottom', 'front', 'side', 'hip_detail', 'collar_band', 'cuff', 'plate', 'collar', 'notes'] },
    { key: 'kameez', en: 'Kameez Only', ur: 'صرف قمیض', icon: '♧', keys: ['length', 'chest', 'shoulder', 'sleeve', 'neck', 'collar', 'cuff', 'waist', 'hip', 'notes'] },
    { key: 'shalwar', en: 'Shalwar Only', ur: 'صرف شلوار', icon: '⋈', keys: ['shalwar_length', 'waist', 'hip', 'thigh', 'knee', 'bottom', 'ghera', 'style', 'notes'] },
    { key: 'waistcoat', en: 'Waistcoat', ur: 'واسکٹ', icon: '♜', keys: ['length', 'chest', 'shoulder', 'waist', 'pockets', 'notes'] },
];
export function seedTemplate(ctx: Context, shopId: string, key: string, unit: Unit): {
    template: Template;
    version: TemplateVersion;
} {
    const item = library.find(i => i.key === key);
    if (!item)
        throw new Error('Unknown system template');
    const template: Template = { ...meta(ctx, shopId), name: item.en, labels: { en: item.en, ur: item.ur }, systemKey: key, activeVersion: 1, isActive: true };
    const fields = item.keys.map((fieldKey, order) => createSystemField(ctx, fieldKey, unit, order));
    return { template, version: { ...meta(ctx, shopId), templateId: template.id, version: 1, fields } };
}


export function createSystemField(ctx: Context, fieldKey: string, unit: Unit, order: number): Field {
    const [en, ur, required] = definitions[fieldKey];
    const type = fieldKey === 'notes' ? 'multiline' : fieldKey === 'measurement_date' ? 'date' : ['serial_number', 'front', 'side', 'hip_detail', 'plate'].includes(fieldKey) ? 'text' : ['collar', 'style'].includes(fieldKey) ? 'select' : fieldKey === 'pockets' ? 'integer' : 'decimal';
    return { id: ctx.id(), fieldKey, labels: { en, ur }, type, required, enabled: true, order, ...(type === 'decimal' ? { unit } : {}), options: type === 'select' ? ['Simple', 'Ban', 'Shirt collar'] : [], helperText: '', ...(type === 'decimal' ? { min: 0.01 } : {}) };
}
