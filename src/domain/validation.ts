import { type Field, type Value, type Workshop } from './model.ts';
export function isDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function money(value: string): number {
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(value.trim()))
        throw new Error('moneyInvalid');
    const [whole, fraction = ''] = value.trim().split('.');
    const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(result))
        throw new Error('moneyInvalid');
    return result;
}
export function formatMoney(value: number) { return (value / 100).toFixed(2); }
export function validateFields(fields: Field[]): void {
    if (!fields.length || !fields.some(f => f.enabled))
        throw new Error('fieldNeeded');
    const keys = new Set();
    const ids = new Set();
    for (const f of fields) {
        if (!/^[a-z][a-z0-9_]*$/.test(f.fieldKey) || keys.has(f.fieldKey) || ids.has(f.id) || !f.labels.en.trim())
            throw new Error('fieldKeyInvalid');
        if (!['decimal', 'integer', 'text', 'multiline', 'select', 'radio', 'checkbox', 'date'].includes(f.type))
            throw new Error('invalidData');
        if (['select', 'radio'].includes(f.type) && (!f.options.length || f.options.some(o => !o.trim()) || new Set(f.options).size !== f.options.length))
            throw new Error('optionsRequired');
        if (f.min !== undefined && !Number.isFinite(f.min))
            throw new Error('invalidData');
        if (f.max !== undefined && (!Number.isFinite(f.max) || (f.min !== undefined && f.max < f.min)))
            throw new Error('invalidData');
        if (f.defaultValue !== undefined && f.defaultValue !== '' && Object.keys(validateValues([{ ...f, enabled: true, required: false }], { [f.fieldKey]: f.defaultValue })).length)
            throw new Error('invalidData');
        keys.add(f.fieldKey);
        ids.add(f.id);
    }
}
export function validateValues(fields: Field[], values: Record<string, Value>): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const f of fields.filter(f => f.enabled)) {
        const v = values[f.fieldKey];
        if (v === '' || v === undefined || v === null) {
            if (f.required)
                errors[f.fieldKey] = 'required';
            continue;
        }
        if (['decimal', 'integer'].includes(f.type)) {
            const n = Number(v);
            if (typeof v === 'boolean' || !Number.isFinite(n) || (f.type === 'integer' && !Number.isInteger(n)) || n < (f.min ?? 0) || (f.max !== undefined && n > f.max))
                errors[f.fieldKey] = 'numberInvalid';
        }
        else if (['select', 'radio'].includes(f.type) && !f.options.includes(String(v)))
            errors[f.fieldKey] = 'optionInvalid';
        else if (f.type === 'checkbox' && typeof v !== 'boolean')
            errors[f.fieldKey] = 'invalidData';
        else if (f.type === 'date' && !isDate(String(v)))
            errors[f.fieldKey] = 'dateInvalid';
        else if (['text', 'multiline'].includes(f.type) && typeof v !== 'string')
            errors[f.fieldKey] = 'invalidData';
    }
    return errors;
}
export function validateWorkshop(s: Workshop) {
    if (!s || s.schemaVersion !== 2)
        throw new Error('backupInvalid');
    const names = ['shops', 'customers', 'templates', 'templateVersions', 'measurements', 'orders', 'orderItems', 'payments'] as const;
    const allIds = new Set<string>();
    for (const name of names) {
        if (!Array.isArray(s[name]))
            throw new Error('backupInvalid');
        for (const r of s[name]) {
            if (!r || typeof r.id !== 'string' || !r.id || allIds.has(r.id) || typeof r.shopId !== 'string' || !Number.isInteger(r.recordVersion) || r.recordVersion < 1 || typeof r.archived !== 'boolean' || !Number.isFinite(Date.parse(r.createdAt)) || !Number.isFinite(Date.parse(r.updatedAt)) || typeof r.deviceId !== 'string')
                throw new Error('backupInvalid');
            allIds.add(r.id);
        }
    }
    const shops = new Map(s.shops.map(r => [r.id, r]));
    for (const n of names)
        for (const r of s[n])
            if (!shops.has(r.shopId))
                throw new Error('shopMismatch');
    for (const shop of s.shops)
        if (shop.id !== shop.shopId || !shop.name?.trim() || typeof shop.ownerName !== 'string' || typeof shop.phone !== 'string' || typeof shop.address !== 'string' || typeof shop.logoPath !== 'string' || !['inch', 'cm'].includes(shop.defaultUnit) || !/^[A-Z]{3}$/.test(shop.currency) || typeof shop.setupComplete !== 'boolean')
            throw new Error('invalidData');
    const customers = new Map(s.customers.map(r => [r.id, r]));
    const templates = new Map(s.templates.map(r => [r.id, r]));
    const measurements = new Map(s.measurements.map(r => [r.id, r]));
    const orders = new Map(s.orders.map(r => [r.id, r]));
    for (const c of s.customers)
        if (!c.name?.trim() || !['phone', 'address', 'notes'].every(k => typeof c[k as keyof typeof c] === 'string'))
            throw new Error('nameRequired');
    const versions = new Set();
    for (const v of s.templateVersions) {
        if (templates.get(v.templateId)?.shopId !== v.shopId || !Number.isInteger(v.version) || v.version < 1 || versions.has(`${v.templateId}:${v.version}`))
            throw new Error('templateInvalid');
        validateFields(v.fields);
        versions.add(`${v.templateId}:${v.version}`);
    }
    for (const t of s.templates)
        if (!t.name?.trim() || !t.labels?.en || typeof t.isActive !== 'boolean' || !versions.has(`${t.id}:${t.activeVersion}`))
            throw new Error('templateInvalid');
    for (const m of s.measurements) {
        const v = s.templateVersions.find(v => v.templateId === m.templateId && v.version === m.templateVersion);
        if (customers.get(m.customerId)?.shopId !== m.shopId || !v || v.shopId !== m.shopId || !m.values || !m.units || Object.keys(validateValues(v.fields, m.values)).length)
            throw new Error('measurementInvalid');
        for (const f of v.fields.filter(f => f.enabled && f.unit))
            if (m.units[f.fieldKey] !== f.unit)
                throw new Error('unitInvalid');
    }
    const orderNumbers = new Set();
    for (const o of s.orders) {
        if (customers.get(o.customerId)?.shopId !== o.shopId || !isDate(o.deliveryDate) || !Number.isSafeInteger(o.totalMinor) || o.totalMinor < 0 || !['new', 'in_progress', 'ready', 'delivered', 'cancelled'].includes(o.status) || !o.orderNumber || orderNumbers.has(`${o.shopId}:${o.orderNumber}`) || !/^[A-Z]{3}$/.test(o.currency))
            throw new Error('orderInvalid');
        orderNumbers.add(`${o.shopId}:${o.orderNumber}`);
        if (!s.orderItems.some(i => i.orderId === o.id))
            throw new Error('measurementRequired');
    }
    for (const i of s.orderItems) {
        const o = orders.get(i.orderId), m = measurements.get(i.measurementId);
        if (!o || !m || o.shopId !== i.shopId || m.shopId !== i.shopId || m.customerId !== o.customerId || !Number.isInteger(i.quantity) || i.quantity < 1 || !i.garment?.trim())
            throw new Error('orderInvalid');
    }
    for (const p of s.payments)
        if (orders.get(p.orderId)?.shopId !== p.shopId || !Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0)
            throw new Error('paymentInvalid');
    for (const o of s.orders)
        if (s.payments.filter(p => p.orderId === o.id).reduce((a, p) => a + p.amountMinor, 0) > o.totalMinor)
            throw new Error('advanceTooHigh');
}

