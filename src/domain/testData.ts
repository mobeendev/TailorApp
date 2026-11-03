import { type Context, type OrderStatus, type Value, type Workshop, meta } from './model.ts';
import { seedTemplate } from './templates.ts';
import { validateWorkshop } from './validation.ts';
const batch = '[Tailor Master test batch v1]';
const maleNames = ['Ahmed Khan', 'Ali Hassan', 'Usman Malik', 'Bilal Ahmed', 'Hamza Shah', 'Omar Farooq', 'Hassan Raza', 'Faisal Mahmood', 'Saad Iqbal', 'Imran Akhtar'];
const femaleNames = ['Ayesha Khan', 'Fatima Ali', 'Maryam Hassan', 'Zainab Malik', 'Hira Ahmed', 'Sana Shah', 'Noor Fatima'];
/** Explicit, repeat-safe development fixtures. Existing records are never modified. */
export function addTestData(data: Workshop, ctx: Context, shopId: string): Workshop {
    const shop = data.shops.find(s => s.id === shopId);
    if (!shop)
        throw new Error('shopMismatch');
    if (data.customers.some(c => c.shopId === shopId && c.notes.includes(batch)))
        return data;
    const next = structuredClone(data);
    const male = seedTemplate(ctx, shopId, 'shalwar-kameez', shop.defaultUnit);
    male.template.name = 'Men’s Shalwar Kameez (Test)';
    male.template.labels = { en: male.template.name, ur: 'مردانہ شلوار قمیض (ٹیسٹ)' };
    const female = seedTemplate(ctx, shopId, 'shalwar-kameez', shop.defaultUnit);
    female.template.name = 'Women’s Suit (Test)';
    female.template.labels = { en: female.template.name, ur: 'خواتین کا سوٹ (ٹیسٹ)' };
    for (const seed of [male, female]) {
        next.templates.push(seed.template);
        next.templateVersions.push(seed.version);
    }
    const links: {
        customerId: string;
        measurementId: string;
        garment: string;
    }[] = [];
    for (const [index, name] of [...maleNames, ...femaleNames].entries()) {
        const isMale = index < 10;
        const seed = isMale ? male : female;
        const customer = { ...meta(ctx, shopId), name: `${name} (Test)`, phone: '', address: '', notes: `${batch} Synthetic ${isMale ? 'male' : 'female'} customer ${isMale ? index + 1 : index - 9}. No real contact details.` };
        next.customers.push(customer);
        const inches: Record<string, number> = { length: isMale ? 40 + index % 5 : 36 + index % 4, chest: 36 + index % 7, shoulder: 14 + index % 5, sleeve: 20 + index % 5, neck: 14 + index % 3, cuff: 8 + index % 3, waist: 30 + index % 9, hip: 38 + index % 7, shalwar_length: 38 + index % 5, shalwar_waist: 30 + index % 8, bottom: 6 + index % 3, ghera: 24 + index % 5 };
        const values: Record<string, Value> = {};
        const units: Record<string, 'inch' | 'cm'> = {};
        for (const f of seed.version.fields) {
            if (f.type === 'decimal') {
                values[f.fieldKey] = Math.round((inches[f.fieldKey] ?? 10) * (f.unit === 'cm' ? 2.54 : 1) * 100) / 100;
                if (f.unit)
                    units[f.fieldKey] = f.unit;
            }
            else if (f.type === 'date')
                values[f.fieldKey] = ctx.now().slice(0, 10);
            else if (f.type === 'select')
                values[f.fieldKey] = f.options[index % f.options.length];
            else
                values[f.fieldKey] = 'Synthetic test measurement';
        }
        const measurement = { ...meta(ctx, shopId), customerId: customer.id, templateId: seed.template.id, templateVersion: 1, values, units };
        next.measurements.push(measurement);
        links.push({ customerId: customer.id, measurementId: measurement.id, garment: seed.template.name });
    }
    const statuses: OrderStatus[] = ['new', 'in_progress', 'ready', 'delivered', 'cancelled'];
    for (let i = 0; i < 50; i++) {
        const link = links[i % links.length];
        const status = statuses[i % statuses.length];
        const day = new Date(ctx.now());
        day.setUTCDate(day.getUTCDate() + i % 21 - 7);
        const created = new Date(ctx.now());
        created.setUTCDate(created.getUTCDate() - i % 14);
        const quantity = 1 + i % 3;
        const totalMinor = (1500 + (i % 8) * 350) * 100 * quantity;
        const advanceMinor = status === 'delivered' ? totalMinor : status === 'cancelled' ? 0 : i % 3 === 0 ? 0 : Math.floor(totalMinor / 2);
        const order = { ...meta(ctx, shopId), createdAt: created.toISOString(), customerId: link.customerId, orderNumber: `TEST-${String(i + 1).padStart(3, '0')}-${ctx.id().slice(0, 6).toUpperCase()}`, deliveryDate: day.toISOString().slice(0, 10), totalMinor, status, instructions: `${batch} Synthetic order ${i + 1}; for testing only.`, currency: shop.currency };
        next.orders.push(order);
        next.orderItems.push({ ...meta(ctx, shopId), orderId: order.id, measurementId: link.measurementId, garment: link.garment, quantity });
        if (advanceMinor)
            next.payments.push({ ...meta(ctx, shopId), orderId: order.id, amountMinor: advanceMinor });
    }
    validateWorkshop(next);
    return next;
}

