import type { Field, Value, Workshop } from './model.ts';
import { localDay } from './dailyWork.ts';

// Urdu (۰-۹) and Arabic (٠-٩) digits count as numbers, so serials typed on an Urdu keyboard continue the sequence.
function westernDigits(value: string) {
    return value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632)));
}

/** Next paper-form serial for a shop: one more than the highest purely numeric serial recorded so far. */
export function nextSerialNumber(data: Workshop, shopId: string): string {
    let highest = 0;
    for (const m of data.measurements) {
        if (m.shopId !== shopId) continue;
        const raw = m.values.serial_number;
        if (typeof raw !== 'string') continue;
        const digits = westernDigits(raw.trim());
        if (!/^\d+$/.test(digits)) continue;
        highest = Math.max(highest, Number(digits));
    }
    return String(highest + 1);
}

/** Fills an empty serial number and measurement date for a new measurement record; filled values are kept. */
export function withRecordDefaults(fields: Field[], values: Record<string, Value>, data: Workshop, shopId: string, today = localDay()): Record<string, Value> {
    const enabled = (key: string) => fields.some(f => f.fieldKey === key && f.enabled);
    const empty = (key: string) => values[key] === undefined || values[key] === '';
    const next = { ...values };
    if (enabled('serial_number') && empty('serial_number')) next.serial_number = nextSerialNumber(data, shopId);
    if (enabled('measurement_date') && empty('measurement_date')) next.measurement_date = today;
    return next;
}
