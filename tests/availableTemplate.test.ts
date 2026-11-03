import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { emptyWorkshop } from '../src/domain/model.ts';
import { availableTemplate, ensureAvailableTemplate } from '../src/domain/availableTemplate.ts';
import { createOrder, createShop, saveCustomer, saveMeasurement } from '../src/domain/services.ts';
import { measurementVersion } from '../src/domain/measurementHistory.ts';
import { Repository, type DB } from '../src/database/repository.ts';

const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'test-device' };
const profile = { name: 'Shop', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' as const };
function adapter(db: DatabaseSync): DB {
    return { execAsync: async sql => { db.exec(sql); }, runAsync: async (sql, ...params) => db.prepare(sql).run(...params), getAllAsync: async <T>(sql: string, ...params: (string | number | null)[]) => db.prepare(sql).all(...params) as T[], withTransactionAsync: async fn => { db.exec('BEGIN'); try { await fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } } };
}

test('an existing shop gets one available Shalwar Kameez template without changing history', async () => {
    const oldShop = createShop(emptyWorkshop(), ctx, profile, ['kameez']);
    const customer = saveCustomer(oldShop.state, ctx, oldShop.shopId, { name: 'Ali', phone: '', address: '', notes: '' });
    const legacyId = customer.state.templates[0].id;
    const measurement = saveMeasurement(customer.state, ctx, oldShop.shopId, customer.customerId, legacyId, { length: 42, chest: 40, shoulder: 18, sleeve: 24 });
    const order = createOrder(measurement.state, ctx, oldShop.shopId, customer.customerId, [{ measurementId: measurement.measurementId, quantity: 1 }], '2026-12-01', '5000', '1000', '');
    const before = structuredClone(order.state);
    const prepared = ensureAvailableTemplate(order.state, ctx, oldShop.shopId);
    const selected = availableTemplate(prepared, oldShop.shopId);
    assert.equal(selected?.systemKey, 'shalwar-kameez');
    assert.equal(prepared.templates.length, before.templates.length + 1);
    assert.deepEqual(prepared.measurements, before.measurements);
    assert.deepEqual(prepared.orders, before.orders);
    assert.deepEqual(prepared.orderItems, before.orderItems);
    assert.deepEqual(prepared.templates[0], before.templates[0]);
    assert.deepEqual(measurementVersion(prepared, prepared.measurements[0]), before.templateVersions[0]);
    assert.strictEqual(ensureAvailableTemplate(prepared, ctx, oldShop.shopId), prepared);
    const db = new DatabaseSync(':memory:');
    try {
        const repo = new Repository(adapter(db)); await repo.initialize(); await repo.save(before); await repo.save(prepared);
        assert.deepEqual(await repo.load(), prepared);
    } finally { db.close(); }
});

test('selection is deterministic and scoped to the selected completed shop', () => {
    const first = createShop(emptyWorkshop(), ctx, profile, ['shalwar-kameez', 'kameez']);
    const second = createShop(first.state, ctx, profile, ['shalwar']);
    assert.equal(availableTemplate(second.state, first.shopId)?.id, first.state.templates[0].id);
    const next = ensureAvailableTemplate(second.state, ctx, second.shopId);
    assert.equal(availableTemplate(next, second.shopId)?.systemKey, 'shalwar-kameez');
    assert.deepEqual(next.templates.filter(t => t.shopId === first.shopId), first.state.templates);
    const incomplete = structuredClone(second.state); incomplete.shops.find(s => s.id === second.shopId)!.setupComplete = false;
    assert.strictEqual(ensureAvailableTemplate(incomplete, ctx, second.shopId), incomplete);
});

test('inactive or archived templates stay in history when a usable template is added', () => {
    const shop = createShop(emptyWorkshop(), ctx, profile, ['shalwar-kameez']);
    shop.state.templates[0].isActive = false;
    const next = ensureAvailableTemplate(shop.state, ctx, shop.shopId);
    assert.equal(next.templates.length, 2);
    assert.equal(next.templates[0].isActive, false);
    assert.notEqual(availableTemplate(next, shop.shopId)?.id, next.templates[0].id);
    assert.strictEqual(ensureAvailableTemplate(next, ctx, shop.shopId), next);
});
