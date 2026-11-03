import { type Context, type Workshop, meta } from './model.ts';
import { createSystemField } from './templates.ts';

// Introduce the paper-form fields in a new template version; existing versions remain immutable.
const addedKeys = ['serial_number', 'measurement_date', 'shirt_length', 'waistcoat_length', 'front', 'side', 'hip_detail', 'collar_band', 'plate'];
export function addPaperFormFields(data: Workshop, ctx: Context): Workshop {
    let next = data;
    for (const template of data.templates.filter(t => t.systemKey === 'shalwar-kameez' && t.isActive && !t.archived)) {
        const version = data.templateVersions.find(v => v.templateId === template.id && v.shopId === template.shopId && v.version === template.activeVersion);
        const shop = data.shops.find(s => s.id === template.shopId);
        if (!version || !shop) continue;
        const missing = addedKeys.filter(key => !version.fields.some(field => field.fieldKey === key));
        if (!missing.length) continue;
        if (next === data) next = structuredClone(data);
        const updated = next.templates.find(t => t.id === template.id)!;
        updated.activeVersion += 1;
        updated.recordVersion += 1;
        updated.updatedAt = ctx.now();
        updated.deviceId = ctx.deviceId;
        const unit = version.fields.find(field => field.fieldKey === 'length')?.unit ?? shop.defaultUnit;
        const order = Math.max(-1, ...version.fields.map(field => field.order)) + 1;
        const fields = structuredClone(version.fields);
        // Keep custom labels intact while using the paper form's terms for default labels.
        const paperLabels: Record<string, [string, string]> = { shoulder: ['کندھا', 'تیرا'], sleeve: ['آستین کی لمبائی', 'بازو'], neck: ['گلا', 'گلہ'] };
        for (const field of fields) { const terms = paperLabels[field.fieldKey]; if (terms && field.labels.ur === terms[0]) field.labels.ur = terms[1]; }
        fields.push(...missing.map((key, index) => createSystemField(ctx, key, unit, order + index)));
        next.templateVersions.push({ ...meta(ctx, shop.id), templateId: template.id, version: updated.activeVersion, fields });
    }
    return next;
}
