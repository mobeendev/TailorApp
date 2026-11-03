import { type Context, type Workshop, emptyWorkshop } from '../domain/model.ts';
import { createOrder, createShop, saveCustomer, saveMeasurement, saveTemplate } from '../domain/services.ts';
import { validateWorkshop } from '../domain/validation.ts';
export function migrateLegacy(raw: string, ctx: Context): {
    state: Workshop;
    language: 'en' | 'ur';
    shopId: string;
} {
    const old = JSON.parse(raw);
    if (old.version !== 1 || !Array.isArray(old.customers) || !Array.isArray(old.orders) || typeof old.urdu !== 'boolean')
        throw new Error('legacyInvalid');
    let { state, shopId } = createShop(emptyWorkshop(), ctx, { name: 'My Tailor Shop', ownerName: 'Owner', phone: 'Update phone', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['shalwar-kameez']);
    state.shops[0].setupComplete = false;
    const fields = state.templateVersions[0].fields.filter(f => ['length', 'chest', 'waist'].includes(f.fieldKey)).map(f => ({ ...f, required: false }));
    state = saveTemplate(state, ctx, shopId, 'Legacy measurements', 'پرانی پیمائش', fields);
    const template = state.templates[state.templates.length - 1];
    const map = new Map<number, {
        customerId: string;
        measurementId: string;
    }>();
    for (const c of old.customers) {
        if (!Number.isSafeInteger(c.id) || map.has(c.id) || typeof c.name !== 'string' || typeof c.phone !== 'string' || !['chest', 'waist', 'length'].every(k => typeof c[k] === 'string'))
            throw new Error('legacyInvalid');
        const customer = saveCustomer(state, ctx, shopId, { name: c.name, phone: c.phone, address: '', notes: '' });
        const measurement = saveMeasurement(customer.state, ctx, shopId, customer.customerId, template.id, { chest: c.chest, waist: c.waist, length: c.length });
        state = measurement.state;
        map.set(c.id, { customerId: customer.customerId, measurementId: measurement.measurementId });
    }
    const ids = new Set<number>();
    for (const o of old.orders) {
        const c = map.get(o.customerId);
        if (!c || !Number.isSafeInteger(o.id) || ids.has(o.id) || !Number.isInteger(o.status) || o.status < 0 || o.status > 4 || !['Thobe', 'Shalwar kameez'].includes(o.garment))
            throw new Error('legacyInvalid');
        ids.add(o.id);
        const order = createOrder(state, ctx, shopId, c.customerId, [{ measurementId: c.measurementId, quantity: 1 }], ctx.now().slice(0, 10), '0', '0', 'Imported from prototype; confirm delivery date and price.');
        state = order.state;
        state.orders[state.orders.length - 1].status = (['new', 'in_progress', 'in_progress', 'ready', 'delivered'] as const)[o.status];
        state.orderItems[state.orderItems.length - 1].garment = o.garment;
    }
    validateWorkshop(state);
    return { state, language: old.urdu ? 'ur' : 'en', shopId };
}

