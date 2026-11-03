import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { calendarDays, collectRemaining, daysFromToday, findCustomers, parseLocalDay } from '../src/domain/ease.ts';
import { emptyWorkshop } from '../src/domain/model.ts';
import { createShop, saveCustomer, saveMeasurement, createOrder, recordPayment } from '../src/domain/services.ts';
import { localDay } from '../src/domain/dailyWork.ts';
const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'qa' };
function fixture() {
    const shop = createShop(emptyWorkshop(), ctx, { name: 'QA', ownerName: 'Owner', phone: '0', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']);
    const customer = saveCustomer(shop.state, ctx, shop.shopId, { name: 'Ali Raza', phone: '+92 (300) 123-4567', address: '', notes: '' });
    const m = saveMeasurement(customer.state, ctx, shop.shopId, customer.customerId, customer.state.templates[0].id, { length: 42, chest: 40, shoulder: 18, sleeve: 24 });
    const order = createOrder(m.state, ctx, shop.shopId, customer.customerId, [{ measurementId: m.measurementId, quantity: 1 }], '2026-11-01', '5000', '1500', '');
    return { ...order, shopId: shop.shopId, customerId: customer.customerId, measurementId: m.measurementId };
}
test('date shortcuts handle month/year boundaries and local dates across daylight-saving changes', () => {
    assert.equal(daysFromToday(1, new Date(2026, 11, 31, 23, 55)), '2027-01-01');
    assert.equal(daysFromToday(7, new Date(2026, 9, 30)), '2026-11-06');
    const zone = process.env.TZ;
    try {
        process.env.TZ = 'America/New_York';
        assert.equal(daysFromToday(2, new Date(2026, 2, 7, 23, 30)), '2026-03-09');
        assert.equal(localDay(parseLocalDay('2026-03-08')!), '2026-03-08');
    } finally { if (zone === undefined) delete process.env.TZ; else process.env.TZ = zone; }
    assert.equal(parseLocalDay('2026-02-30'), null);
});
test('calendar has correctly aligned valid days, leap years, and seven-cell rows', () => {
    const leap = calendarDays(2028, 1); assert.equal(leap.filter(Boolean).length, 29); assert.ok(leap.includes('2028-02-29')); assert.equal(leap.length % 7, 0);
    assert.equal(calendarDays(2100, 1).filter(Boolean).length, 28);
    assert.equal(calendarDays(2026, 10).indexOf('2026-11-01'), new Date(2026, 10, 1).getDay());
    assert.equal(calendarDays(2026, 12).filter(Boolean)[0], '2027-01-01');
});
test('customer search matches names and formatted/Urdu phone digits without leaking archived or other-shop records', () => {
    const f = fixture(); const state = saveCustomer(f.state, ctx, f.shopId, { name: 'Archived Ali', phone: '1234567', address: '', notes: '' }).state;
    state.customers[1].archived = true;
    state.customers.push({ ...state.customers[0], id: 'other', shopId: 'different-shop' });
    assert.deepEqual(findCustomers(state, f.shopId, '  ALI ').map(c => c.id), [f.customerId]);
    assert.equal(findCustomers(state, f.shopId, '3001234567').length, 1);
    assert.equal(findCustomers(state, f.shopId, '۳۰۰۱۲۳۴۵۶۷').length, 1);
    assert.equal(findCustomers(state, f.shopId, '+92 300 123').length, 1);
    assert.equal(findCustomers(state, f.shopId, 'missing').length, 0);
    assert.equal(findCustomers(state, f.shopId, 'Ali', true).length, 2);
});
test('full-balance collection records exactly one payment and leaves other orders untouched', () => {
    const f = fixture(); const second = createOrder(f.state, ctx, f.shopId, f.customerId, [{ measurementId: f.measurementId, quantity: 2 }], '2026-11-02', '8000', '2000', '');
    const original = JSON.stringify(second.state);
    const result = collectRemaining(second.state, ctx, f.shopId, f.orderId, 350000);
    assert.equal(result.payments.filter(p => p.orderId === f.orderId).reduce((a, p) => a + p.amountMinor, 0), 500000);
    assert.deepEqual(result.payments.filter(p => p.orderId === second.orderId), second.state.payments.filter(p => p.orderId === second.orderId));
    assert.equal(JSON.stringify(second.state), original);
    assert.throws(() => collectRemaining(result, ctx, f.shopId, f.orderId, 350000), /balanceChanged/);
});
test('confirmation rejects changed balance, cancelled orders, wrong shops and invalid expected amounts', () => {
    const f = fixture(); const afterPayment = recordPayment(f.state, ctx, f.shopId, f.orderId, '100');
    assert.throws(() => collectRemaining(afterPayment, ctx, f.shopId, f.orderId, 350000), /balanceChanged/);
    assert.throws(() => collectRemaining(f.state, ctx, 'other', f.orderId, 350000), /paymentInvalid/);
    for (const amount of [0, -1, 350000.5]) assert.throws(() => collectRemaining(f.state, ctx, f.shopId, f.orderId, amount), /balanceChanged/);
    f.state.orders[0].status = 'cancelled';
    assert.throws(() => collectRemaining(f.state, ctx, f.shopId, f.orderId, 350000), /paymentInvalid/);
});
