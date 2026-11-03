import { type Context, type Customer, type Field, type Shop, type Value, type Workshop, meta } from './model.ts';
import { seedTemplate } from './templates.ts';
import { isDate, money, validateFields, validateValues, validateWorkshop } from './validation.ts';
export function createShop(s: Workshop, ctx: Context, profile: Pick<Shop, 'name' | 'ownerName' | 'phone' | 'address' | 'logoPath' | 'currency' | 'defaultUnit'>, keys: string[]) {
    if (!profile.name.trim() || !profile.ownerName.trim() || !profile.phone.trim())
        throw new Error('shopRequired');
    if (!keys.length)
        throw new Error('templateRequired');
    const shopId = ctx.id();
    const shop: Shop = { ...meta(ctx, shopId), ...profile, id: shopId, setupComplete: true };
    const next = structuredClone(s);
    next.shops.push(shop);
    for (const key of [...new Set(keys)]) {
        const { template, version } = seedTemplate(ctx, shopId, key, profile.defaultUnit);
        next.templates.push(template);
        next.templateVersions.push(version);
    }
    validateWorkshop(next);
    return { state: next, shopId };
}
export function saveCustomer(s: Workshop, ctx: Context, shopId: string, input: Pick<Customer, 'name' | 'phone' | 'address' | 'notes'>, id?: string) {
    if (!input.name.trim())
        throw new Error('nameRequired');
    const next = structuredClone(s);
    const previous = next.customers.find(c => c.id === id && c.shopId === shopId);
    if (id && !previous)
        throw new Error('customerMissing');
    const c = previous ? { ...previous, ...input, name: input.name.trim(), updatedAt: ctx.now(), recordVersion: previous.recordVersion + 1, deviceId: ctx.deviceId } : { ...meta(ctx, shopId), ...input, name: input.name.trim() };
    next.customers = [...next.customers.filter(i => i.id !== c.id), c];
    validateWorkshop(next);
    return { state: next, customerId: c.id };
}
export function saveTemplate(s: Workshop, ctx: Context, shopId: string, name: string, ur: string, fields: Field[], templateId?: string) {
    validateFields(fields);
    if (!name.trim())
        throw new Error('nameRequired');
    const next = structuredClone(s);
    const previous = next.templates.find(t => t.id === templateId && t.shopId === shopId);
    if (templateId && !previous)
        throw new Error('templateInvalid');
    const template = previous ? { ...previous, name, labels: { en: name, ur }, activeVersion: previous.activeVersion + 1, updatedAt: ctx.now(), recordVersion: previous.recordVersion + 1, deviceId: ctx.deviceId } : { ...meta(ctx, shopId), name, labels: { en: name, ur }, activeVersion: 1, isActive: true };
    next.templates = [...next.templates.filter(t => t.id !== template.id), template];
    next.templateVersions.push({ ...meta(ctx, shopId), templateId: template.id, version: template.activeVersion, fields: structuredClone(fields) });
    validateWorkshop(next);
    return next;
}
export function saveMeasurement(s: Workshop, ctx: Context, shopId: string, customerId: string, templateId: string, values: Record<string, Value>) {
    const customer = s.customers.find(c => c.id === customerId && c.shopId === shopId && !c.archived);
    const template = s.templates.find(t => t.id === templateId && t.shopId === shopId && t.isActive && !t.archived);
    const version = s.templateVersions.find(v => v.templateId === templateId && v.version === template?.activeVersion);
    if (!customer || !template || !version)
        throw new Error('measurementInvalid');
    if (Object.keys(validateValues(version.fields, values)).length)
        throw new Error('measurementInvalid');
    const normalized: Record<string, Value> = {};
    const units: Record<string, 'inch' | 'cm'> = {};
    for (const f of version.fields.filter(f => f.enabled)) {
        const v = values[f.fieldKey];
        if (v !== undefined && v !== '')
            normalized[f.fieldKey] = ['decimal', 'integer'].includes(f.type) ? Number(v) : v;
        if (f.unit)
            units[f.fieldKey] = f.unit;
    }
    const next = structuredClone(s);
    const measurement = { ...meta(ctx, shopId), customerId, templateId, templateVersion: version.version, values: normalized, units };
    next.measurements.push(measurement);
    validateWorkshop(next);
    return { state: next, measurementId: measurement.id };
}
export function createOrder(s: Workshop, ctx: Context, shopId: string, customerId: string, items: {
    measurementId: string;
    quantity: number;
}[], deliveryDate: string, total: string, advance: string, instructions: string) {
    if (!isDate(deliveryDate))
        throw new Error('dateInvalid');
    const totalMinor = money(total), advanceMinor = money(advance);
    if (advanceMinor > totalMinor)
        throw new Error('advanceTooHigh');
    if (!items.length)
        throw new Error('measurementRequired');
    const next = structuredClone(s);
    const shop = s.shops.find(i => i.id === shopId);
    if (!shop)
        throw new Error('shopMismatch');
    const order = { ...meta(ctx, shopId), customerId, orderNumber: `TM-${ctx.id().slice(0, 8).toUpperCase()}`, deliveryDate, totalMinor, status: 'new' as const, instructions, currency: shop.currency };
    next.orders.push(order);
    for (const i of items) {
        const measurement = s.measurements.find(m => m.id === i.measurementId && m.customerId === customerId && m.shopId === shopId);
        if (!measurement)
            throw new Error('measurementRequired');
        const template = s.templates.find(t => t.id === measurement.templateId)!;
        next.orderItems.push({ ...meta(ctx, shopId), orderId: order.id, measurementId: i.measurementId, garment: template.name, quantity: i.quantity });
    }
    if (advanceMinor)
        next.payments.push({ ...meta(ctx, shopId), orderId: order.id, amountMinor: advanceMinor });
    validateWorkshop(next);
    return { state: next, orderId: order.id };
}
export function recordPayment(s: Workshop, ctx: Context, shopId: string, orderId: string, amount: string) {
    const minor = money(amount);
    if (!minor)
        throw new Error('paymentInvalid');
    const next = structuredClone(s);
    next.payments.push({ ...meta(ctx, shopId), orderId, amountMinor: minor });
    validateWorkshop(next);
    return next;
}

