import type { Context, Workshop } from './model.ts';
import { localDay } from './dailyWork.ts';
import { isDate, formatMoney } from './validation.ts';
import { recordPayment } from './services.ts';
export function parseLocalDay(value: string) {
    if (!isDate(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
}
export function daysFromToday(days: number, today = new Date()) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    date.setDate(date.getDate() + days);
    return localDay(date);
}
export function calendarDays(year: number, month: number): (string | null)[] {
    const start = new Date(year, month, 1, 12);
    const end = new Date(year, month + 1, 0, 12).getDate();
    const cells: (string | null)[] = Array(start.getDay()).fill(null);
    for (let day = 1; day <= end; day++) cells.push(localDay(new Date(year, month, day, 12)));
    while (cells.length % 7) cells.push(null);
    return cells;
}
export function findCustomers(data: Workshop, shopId: string, query: string, includeArchived = false) {
    const q = query.trim().toLowerCase();
    const digits = (value: string) => value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632))).replace(/\D/g, '');
    const phoneQuery = digits(q);
    const phoneOnly = /^[\d۰-۹٠-٩+\s().-]+$/u.test(q) && phoneQuery.length > 0;
    return data.customers.filter(c => c.shopId === shopId && (includeArchived || !c.archived) && (!q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (phoneOnly && digits(c.phone).includes(phoneQuery))));
}
export function collectRemaining(data: Workshop, ctx: Context, shopId: string, orderId: string, expectedMinor: number) {
    const order = data.orders.find(o => o.id === orderId && o.shopId === shopId && !o.archived);
    if (!order || order.status === 'cancelled') throw new Error('paymentInvalid');
    const paid = data.payments.filter(p => p.orderId === orderId).reduce((n, p) => n + p.amountMinor, 0);
    const remaining = order.totalMinor - paid;
    if (!Number.isSafeInteger(expectedMinor) || expectedMinor <= 0 || remaining !== expectedMinor) throw new Error('balanceChanged');
    return recordPayment(data, ctx, shopId, orderId, formatMoney(remaining));
}
