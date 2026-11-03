import type { Field, Measurement, TemplateVersion, Value, Workshop, Unit } from './model.ts';
import { validateValues } from './validation.ts';
export function measurementHistory(data: Workshop, shopId: string, customerId: string, templateId?: string) {
    return data.measurements.filter(m => m.shopId === shopId && m.customerId === customerId && !m.archived && (!templateId || m.templateId === templateId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
export function measurementVersion(data: Workshop, m: Measurement) {
    return data.templateVersions.find(v => v.shopId === m.shopId && v.templateId === m.templateId && v.version === m.templateVersion);
}
export function converted(value: number, from?: Unit, to?: Unit) {
    if (from === to) return value;
    if (!from || !to) return null;
    return Math.round((from === 'inch' ? value * 2.54 : value / 2.54) * 10000) / 10000;
}
export function copyMeasurement(data: Workshop, shopId: string, customerId: string, sourceId: string) {
    const source = measurementHistory(data, shopId, customerId).find(m => m.id === sourceId);
    const template = data.templates.find(t => t.id === source?.templateId && t.shopId === shopId && t.isActive && !t.archived);
    const target = data.templateVersions.find(v => v.templateId === template?.id && v.shopId === shopId && v.version === template.activeVersion);
    const original = source && measurementVersion(data, source);
    if (!source || !target || !original || !data.customers.some(c => c.id === customerId && c.shopId === shopId && !c.archived)) throw new Error('copyUnavailable');
    const values: Record<string, Value> = {};
    let copied = 0, skipped = 0;
    for (const f of target.fields.filter(f => f.enabled)) {
        // A new record must not inherit the source paper entry's serial number or date.
        if (['serial_number', 'measurement_date'].includes(f.fieldKey)) continue;
        if (f.defaultValue !== undefined) values[f.fieldKey] = f.defaultValue;
        const old = original.fields.find(o => o.fieldKey === f.fieldKey && o.enabled);
        let value = source.values[f.fieldKey];
        if (!old || value === undefined || value === '') continue;
        const numeric = ['decimal', 'integer'].includes(f.type) && ['decimal', 'integer'].includes(old.type);
        const compatible = numeric || old.type === f.type || (['text', 'multiline'].includes(old.type) && ['text', 'multiline'].includes(f.type));
        if (numeric) {
            const n = converted(Number(value), source.units[f.fieldKey], f.unit);
            value = n === null ? '' : n;
        }
        if (!compatible || value === '' || Object.keys(validateValues([{ ...f, required: false }], { [f.fieldKey]: value })).length) { skipped++; continue; }
        values[f.fieldKey] = value;
        copied++;
    }
    return { source, target, templateId: template!.id, values, copied, skipped };
}
export type ComparisonRow = { field: Field; oldField?: Field; newField?: Field; before?: Value; after?: Value; beforeUnit?: Unit; afterUnit?: Unit; changed: boolean; delta: number | null };
export function compareMeasurements(data: Workshop, shopId: string, customerId: string, oldId: string, newId: string): ComparisonRow[] {
    const history = measurementHistory(data, shopId, customerId);
    const old = history.find(m => m.id === oldId), next = history.find(m => m.id === newId);
    if (!old || !next || old.templateId !== next.templateId) throw new Error('comparisonUnavailable');
    const a = measurementVersion(data, old), b = measurementVersion(data, next);
    if (!a || !b) throw new Error('comparisonUnavailable');
    const fields = (v: TemplateVersion) => v.fields.filter(f => f.enabled).sort((a, b) => a.order - b.order);
    const keys = [...new Set([...fields(b), ...fields(a)].map(f => f.fieldKey))];
    return keys.map(key => {
        const oldField = fields(a).find(f => f.fieldKey === key), newField = fields(b).find(f => f.fieldKey === key);
        const before = oldField ? old.values[key] : undefined, after = newField ? next.values[key] : undefined;
        const beforeUnit = old.units[key], afterUnit = next.units[key];
        let delta: number | null = null;
        if (oldField && newField && ['decimal', 'integer'].includes(oldField.type) && ['decimal', 'integer'].includes(newField.type) && before !== undefined && before !== '' && after !== undefined && after !== '') {
            const previous = converted(Number(before), beforeUnit, afterUnit);
            if (previous !== null) delta = Math.round((Number(after) - previous) * 10000) / 10000;
        }
        const changed = !oldField || !newField || oldField.type !== newField.type || (delta !== null ? delta !== 0 : before !== after || beforeUnit !== afterUnit);
        return { field: newField ?? oldField!, oldField, newField, before, after, beforeUnit, afterUnit, changed, delta };
    });
}
