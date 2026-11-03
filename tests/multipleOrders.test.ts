import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyWorkshop, type Workshop } from '../src/domain/model.ts';
import { createShop, saveCustomer, saveMeasurement, createOrder, recordPayment, saveTemplate } from '../src/domain/services.ts';
import { Repository, type DB } from '../src/database/repository.ts';
import { dailyOrders } from '../src/domain/dailyWork.ts';
import { receiptHtml } from '../src/services/receipt.ts';
const ctx = { id: randomUUID, now: () => '2026-10-30T09:00:00Z', deviceId: 'multi-order-test' };
function adapter(db: DatabaseSync): DB {
    return { execAsync: async s => { db.exec(s); }, runAsync: async (s, ...p) => db.prepare(s).run(...p), getAllAsync: async <T>(s: string, ...p: (string | number | null)[]) => db.prepare(s).all(...p) as T[], withTransactionAsync: async f => { db.exec('BEGIN'); try { await f(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } } };
}
function balance(s: Workshop, id: string) { return s.orders.find(o => o.id === id)!.totalMinor - s.payments.filter(p => p.orderId === id).reduce((a, p) => a + p.amountMinor, 0); }
test('one immutable measurement supports three independent orders, receipts, payments and filters across SQLite restarts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tailor-multi-orders-')); let db: DatabaseSync | undefined;
    try {
        const file = join(dir, 'qa.db'); db = new DatabaseSync(file); let repo = new Repository(adapter(db)); await repo.initialize();
        const shop = createShop(emptyWorkshop(), ctx, { name: 'Multi-order QA', ownerName: 'Tester', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']);
        const customer = saveCustomer(shop.state, ctx, shop.shopId, { name: 'Same Measurement Customer', phone: '', address: '', notes: '' });
        const templateId = customer.state.templates[0].id;
        const m = saveMeasurement(customer.state, ctx, shop.shopId, customer.customerId, templateId, { length: 42, chest: 40, shoulder: 18, sleeve: 24 });
        const frozenMeasurement = JSON.stringify(m.state.measurements[0]);
        await repo.save(m.state);
        let state = m.state; const orderIds: string[] = [];
        const specs = [{ date: '2026-10-30', quantity: 1, total: '5000', advance: '1500' }, { date: '2026-10-29', quantity: 2, total: '8000', advance: '2000' }, { date: '2026-11-05', quantity: 3, total: '9000', advance: '0' }];
        for (const spec of specs) {
            const order = createOrder(state, ctx, shop.shopId, customer.customerId, [{ measurementId: m.measurementId, quantity: spec.quantity }], spec.date, spec.total, spec.advance, 'QA');
            state = order.state; orderIds.push(order.orderId); await repo.save(state);
        }
        assert.equal(new Set(state.orders.map(o => o.orderNumber)).size, 3);
        assert.deepEqual(state.orderItems.map(i => i.measurementId), [m.measurementId, m.measurementId, m.measurementId]);
        assert.deepEqual(state.orderItems.map(i => i.quantity), [1, 2, 3]);
        assert.equal(state.measurements.length, 1);
        assert.equal(JSON.stringify(state.measurements[0]), frozenMeasurement);
        state = recordPayment(state, ctx, shop.shopId, orderIds[0], '3500'); await repo.save(state);
        assert.deepEqual(orderIds.map(id => balance(state, id)), [0, 600000, 900000]);
        const beforeFailure = JSON.stringify(await repo.load());
        assert.throws(() => recordPayment(state, ctx, shop.shopId, orderIds[0], '0.01'), /advanceTooHigh/);
        assert.equal(JSON.stringify(await repo.load()), beforeFailure);
        state = recordPayment(state, ctx, shop.shopId, orderIds[1], '1000'); await repo.save(state);
        state = structuredClone(state);
        Object.assign(state.orders.find(o => o.id === orderIds[0])!, { status: 'delivered', recordVersion: 2 });
        Object.assign(state.orders.find(o => o.id === orderIds[1])!, { status: 'ready', recordVersion: 2 });
        await repo.save(state);
        assert.deepEqual(state.orders.map(o => o.status), ['delivered', 'ready', 'new']);
        assert.deepEqual(dailyOrders(state, shop.shopId, '2026-10-30', 'overdue').map(o => o.id), [orderIds[1]]);
        assert.deepEqual(new Set(dailyOrders(state, shop.shopId, '2026-10-30', 'unpaid').map(o => o.id)), new Set([orderIds[1], orderIds[2]]));
        // Evolving the template and taking a new measurement never retargets existing orders.
        state = saveTemplate(state, ctx, shop.shopId, 'Updated Qameez', '', state.templateVersions[0].fields, templateId);
        state = saveMeasurement(state, ctx, shop.shopId, customer.customerId, templateId, { length: 43, chest: 42, shoulder: 18, sleeve: 24 }).state;
        await repo.save(state);
        assert.equal(state.measurements[1].templateVersion, 2);
        assert.ok(state.orderItems.every(i => i.measurementId === m.measurementId));
        assert.equal(JSON.stringify(state.measurements[0]), frozenMeasurement);
        for (let i = 0; i < orderIds.length; i++) {
            const html = receiptHtml(state, orderIds[i], 'ur', k => k);
            assert.ok(html.includes(state.orders[i].orderNumber));
            assert.ok(html.includes(`<th>remaining</th><td>PKR ${(balance(state, orderIds[i]) / 100).toFixed(2)}</td>`));
            for (const other of state.orders.filter(o => o.id !== orderIds[i])) assert.ok(!html.includes(other.orderNumber));
        }
        db.close(); db = new DatabaseSync(file); repo = new Repository(adapter(db)); await repo.initialize(); state = await repo.load();
        assert.deepEqual(orderIds.map(id => balance(state, id)), [0, 500000, 900000]);
        assert.deepEqual(state.orders.map(o => o.status), ['delivered', 'ready', 'new']);
        const links = db.prepare('SELECT o.id, i.measurement_id FROM Orders o JOIN OrderItems i ON i.order_id=o.id WHERE i.measurement_id=?').all(m.measurementId);
        assert.equal(links.length, 3);
        assert.equal(JSON.stringify(state.measurements.find(i => i.id === m.measurementId)), frozenMeasurement);
        const saved = JSON.stringify(state);
        const other = saveCustomer(state, ctx, shop.shopId, { name: 'Other Customer', phone: '', address: '', notes: '' });
        assert.throws(() => createOrder(other.state, ctx, shop.shopId, other.customerId, [{ measurementId: m.measurementId, quantity: 1 }], '2026-11-06', '100', '0', ''), /measurementRequired/);
        assert.equal(JSON.stringify(await repo.load()), saved);
    } finally { db?.close(); rmSync(dir, { recursive: true }); }
});

test('a repeat customer can reuse a measurement or order with an updated copy while both orders retain their measurements after restart', async () => {
    const { copyMeasurement } = await import('../src/domain/measurementHistory.ts');
    const dir = mkdtempSync(join(tmpdir(), 'tailor-updated-order-')); let db: DatabaseSync | undefined;
    try {
        const file = join(dir, 'qa.db'); db = new DatabaseSync(file); let repo = new Repository(adapter(db)); await repo.initialize();
        const shop = createShop(emptyWorkshop(), ctx, { name: 'QA', ownerName: 'Tester', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['shalwar-kameez']);
        const customer = saveCustomer(shop.state, ctx, shop.shopId, { name: 'Repeat customer', phone: '', address: '', notes: '' });
        const templateId = customer.state.templates[0].id;
        const first = saveMeasurement(customer.state, ctx, shop.shopId, customer.customerId, templateId, { length: 42, chest: 40, shoulder: 18, sleeve: 24, shalwar_length: 39 });
        const firstOrder = createOrder(first.state, ctx, shop.shopId, customer.customerId, [{ measurementId: first.measurementId, quantity: 1 }], '2026-11-01', '5000', '0', '');
        const copy = copyMeasurement(firstOrder.state, shop.shopId, customer.customerId, first.measurementId);
        assert.equal(copy.values.chest, 40);
        const updated = saveMeasurement(firstOrder.state, ctx, shop.shopId, customer.customerId, templateId, { ...copy.values, chest: '42', shalwar_length: '40' });
        const secondOrder = createOrder(updated.state, ctx, shop.shopId, customer.customerId, [{ measurementId: updated.measurementId, quantity: 1 }], '2026-11-02', '5500', '0', '');
        const sameOrder = createOrder(secondOrder.state, ctx, shop.shopId, customer.customerId, [{ measurementId: updated.measurementId, quantity: 1 }], '2026-11-03', '5500', '0', '');
        await repo.save(sameOrder.state);
        db.close(); db = new DatabaseSync(file); repo = new Repository(adapter(db)); await repo.initialize();
        const saved = await repo.load();
        const measurementFor = (orderId: string) => saved.measurements.find(m => m.id === saved.orderItems.find(i => i.orderId === orderId)?.measurementId)!;
        assert.equal(measurementFor(firstOrder.orderId).id, first.measurementId);
        assert.equal(measurementFor(firstOrder.orderId).values.chest, 40);
        assert.equal(measurementFor(firstOrder.orderId).values.shalwar_length, 39);
        for (const orderId of [secondOrder.orderId, sameOrder.orderId]) {
            assert.equal(measurementFor(orderId).id, updated.measurementId);
            assert.equal(measurementFor(orderId).values.chest, 42);
            assert.equal(measurementFor(orderId).values.shalwar_length, 40);
        }
        assert.equal(saved.measurements.length, 2);
        assert.throws(() => saveMeasurement(saved, ctx, shop.shopId, customer.customerId, templateId, { ...copy.values, chest: '-1' }), /measurementInvalid/);
        assert.equal((await repo.load()).measurements.length, 2);
    } finally { db?.close(); rmSync(dir, { recursive: true }); }
});
