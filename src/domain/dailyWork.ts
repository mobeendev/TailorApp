import type { Workshop } from './model.ts';
export type WorkFilter = 'all' | 'today' | 'overdue' | 'unpaid';
export function localDay(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dailyOrders(data: Workshop, shopId: string, today: string, filter: WorkFilter = 'all', status = 'all', search = '') {
    const paid = new Map<string, number>();
    for (const p of data.payments.filter(p => p.shopId === shopId)) paid.set(p.orderId, (paid.get(p.orderId) ?? 0) + p.amountMinor);
    const names = new Map(data.customers.filter(c => c.shopId === shopId).map(c => [c.id, c.name]));
    return data.orders.filter(o => {
        if (o.shopId !== shopId || o.archived || (status !== 'all' && o.status !== status)) return false;
        if (!`${o.orderNumber} ${names.get(o.customerId) ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
        const openDelivery = !['delivered', 'cancelled'].includes(o.status);
        if (filter === 'today') return openDelivery && o.deliveryDate === today;
        if (filter === 'overdue') return openDelivery && o.deliveryDate < today;
        if (filter === 'unpaid') return o.status !== 'cancelled' && o.totalMinor > (paid.get(o.id) ?? 0);
        return true;
    }).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.orderNumber.localeCompare(b.orderNumber));
}
export function dailyWorkCounts(data: Workshop, shopId: string, today: string): Record<WorkFilter, number> {
    const counts = { all: 0, today: 0, overdue: 0, unpaid: 0 };
    const paid = new Map<string, number>();
    for (const p of data.payments) if (p.shopId === shopId) paid.set(p.orderId, (paid.get(p.orderId) ?? 0) + p.amountMinor);
    for (const o of data.orders) {
        if (o.shopId !== shopId || o.archived) continue;
        counts.all++;
        if (!['delivered', 'cancelled'].includes(o.status)) { if (o.deliveryDate === today) counts.today++; if (o.deliveryDate < today) counts.overdue++; }
        if (o.status !== 'cancelled' && o.totalMinor > (paid.get(o.id) ?? 0)) counts.unpaid++;
    }
    return counts;
}
