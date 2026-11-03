import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createOrder, createShop, saveCustomer, saveMeasurement } from '../src/domain/services.ts';
import { emptyWorkshop } from '../src/domain/model.ts';
import { dailyOrders, dailyWorkCounts, localDay } from '../src/domain/dailyWork.ts';
function fixture() {
    const ctx = { id: randomUUID, now: () => '2026-10-30T08:00:00Z', deviceId: 'qa' };
    const a = createShop(emptyWorkshop(), ctx, { name: 'Shop', ownerName: 'Owner', phone: '0', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']);
    const c = saveCustomer(a.state, ctx, a.shopId, { name: 'Ali', phone: '', address: '', notes: '' });
    const m = saveMeasurement(c.state, ctx, a.shopId, c.customerId, c.state.templates[0].id, { length: 42, chest: 40, shoulder: 18, sleeve: 24 });
    const o = createOrder(m.state, ctx, a.shopId, c.customerId, [{ measurementId: m.measurementId, quantity: 1 }], '2026-10-30', '5000', '1500', '');
    return { state: o.state, shopId: a.shopId, order: o.state.orders[0] };
}
test('today and overdue use delivery date, exclude handed-over/cancelled/archived orders and isolate shops', () => {
    const f = fixture();
    const rows = [
        { ...f.order, id: 'late', deliveryDate: '2026-10-29', status: 'ready' as const },
        { ...f.order, id: 'done', status: 'delivered' as const },
        { ...f.order, id: 'cancel', status: 'cancelled' as const },
        { ...f.order, id: 'future', deliveryDate: '2026-10-31' },
        { ...f.order, id: 'archive', archived: true },
        { ...f.order, id: 'other', shopId: 'other-shop' },
    ];
    f.state.orders.push(...rows);
    assert.deepEqual(dailyOrders(f.state, f.shopId, '2026-10-30', 'today').map(o => o.id), [f.order.id]);
    assert.deepEqual(dailyOrders(f.state, f.shopId, '2026-10-30', 'overdue').map(o => o.id), ['late']);
    assert.equal(dailyOrders(f.state, f.shopId, '2026-10-31', 'overdue').length, 2);
    for (const k of ['all', 'today', 'overdue', 'unpaid'] as const) assert.equal(dailyWorkCounts(f.state, f.shopId, '2026-10-30')[k], dailyOrders(f.state, f.shopId, '2026-10-30', k).length);
});
test('unpaid includes delivered balances, aggregates payments and combines status/search filters', () => {
    const f = fixture(); f.state.orders[0].status = 'delivered';
    assert.equal(dailyOrders(f.state, f.shopId, '2026-10-30', 'unpaid', 'delivered', ' ALI ').length, 1);
    assert.equal(dailyOrders(f.state, f.shopId, '2026-10-30', 'unpaid', 'ready').length, 0);
    assert.equal(dailyOrders(f.state, f.shopId, '2026-10-30', 'unpaid', 'all', 'missing').length, 0);
    f.state.payments.push({ ...f.state.payments[0], id: randomUUID(), amountMinor: 350000 });
    assert.equal(dailyOrders(f.state, f.shopId, '2026-10-30', 'unpaid').length, 0);
});
test('local day uses phone calendar components rather than UTC slicing', () => {
    const d = new Date(2026, 9, 30, 0, 15);
    assert.equal(localDay(d), '2026-10-30');
});
