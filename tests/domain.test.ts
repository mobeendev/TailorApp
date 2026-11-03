import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { emptyWorkshop, type Context } from '../src/domain/model.ts';
import { createOrder, createShop, recordPayment, saveCustomer, saveMeasurement, saveTemplate } from '../src/domain/services.ts';
import { money, validateValues, validateWorkshop } from '../src/domain/validation.ts';
import { Repository, type DB } from '../src/database/repository.ts';
const ctx: Context = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'test-device' };
function fixture() {
    const { state, shopId } = createShop(emptyWorkshop(), ctx, { name: 'Test Tailors', ownerName: 'Owner', phone: '0300', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']);
    const c = saveCustomer(state, ctx, shopId, { name: 'Ali', phone: '123', address: '', notes: '' });
    const t = c.state.templates[0];
    const m = saveMeasurement(c.state, ctx, shopId, c.customerId, t.id, { length: '42.5', chest: '40', shoulder: '18', sleeve: '24' });
    return { ...m, shopId, customerId: c.customerId, templateId: t.id };
}
function dbAdapter(): DB { const db = new DatabaseSync(':memory:'); return { execAsync: async (sql) => { db.exec(sql); }, runAsync: async (sql, ...p) => db.prepare(sql).run(...p), getAllAsync: async <T>(sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as T[], withTransactionAsync: async (fn) => { db.exec('BEGIN'); try {
        await fn();
        db.exec('COMMIT');
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    } } }; }
test('shop setup requires identity and selected templates', () => { assert.throws(() => createShop(emptyWorkshop(), ctx, { name: '', ownerName: '', phone: '', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, [])); });
test('fixed decimal money avoids binary rounding and rejects invalid amounts', () => { assert.equal(money('0.29') + money('0.01'), 30); for (const s of ['-1', '1.001', 'NaN', '1e3', ''])
    assert.throws(() => money(s)); });
test('dynamic fields validate each supported type', () => { const f = fixture().state.templateVersions[0].fields[0]; assert.equal(validateValues([f], {}).length, 'required'); assert.equal(validateValues([f], { length: 'abc' }).length, 'numberInvalid'); assert.deepEqual(validateValues([{ ...f, type: 'checkbox' }], { length: false }), {}); assert.equal(validateValues([{ ...f, type: 'date' }], { length: '2026-02-30' }).length, 'dateInvalid'); assert.equal(validateValues([{ ...f, type: 'select', options: ['Ban'] }], { length: 'Other' }).length, 'optionInvalid'); assert.equal(validateValues([{ ...f, type: 'integer' }], { length: '2.5' }).length, 'numberInvalid'); });
test('template edits create immutable history and preserve units', () => { const f = fixture(); const old = JSON.stringify(f.state.templateVersions[0]); const next = saveTemplate(f.state, ctx, f.shopId, 'Kameez', 'قمیض', f.state.templateVersions[0].fields.map(i => ({ ...i, unit: i.unit ? 'cm' : undefined })), f.templateId); assert.equal(next.templates[0].activeVersion, 2); assert.equal(JSON.stringify(next.templateVersions[0]), old); assert.equal(next.measurements[0].templateVersion, 1); assert.equal(next.measurements[0].units.chest, 'inch'); });
test('orders reference measurements, support multiple items and exact balances', () => { const f = fixture(); const o = createOrder(f.state, ctx, f.shopId, f.customerId, [{ measurementId: f.measurementId, quantity: 2 }, { measurementId: f.measurementId, quantity: 1 }], '2026-12-01', '100.10', '20.05', ''); assert.equal(o.state.orderItems.length, 2); assert.equal(o.state.orders[0].totalMinor - o.state.payments[0].amountMinor, 8005); assert.throws(() => recordPayment(o.state, ctx, f.shopId, o.orderId, '80.06')); assert.throws(() => createOrder(f.state, ctx, f.shopId, f.customerId, [], '2026-02-30', '100', '0', '')); });
test('cross-shop relationships are rejected', () => { const f = fixture(); const next = structuredClone(f.state); next.customers[0].shopId = 'other'; assert.throws(() => validateWorkshop(next)); });
test('SQLite migrations are repeatable and data round-trips', async () => { const repo = new Repository(dbAdapter()); await repo.initialize(); await repo.initialize(); const f = fixture(); await repo.save(f.state); assert.deepEqual(await repo.load(), f.state); });
test('repository rejects stale changes and physical deletion', async () => { const repo = new Repository(dbAdapter()); await repo.initialize(); const f = fixture(); await repo.save(f.state); const next = structuredClone(f.state); next.customers[0].name = 'Changed'; await assert.rejects(repo.save(next), /staleRecord/); assert.equal((await repo.load()).customers[0].name, 'Ali'); next.customers = []; await assert.rejects(repo.save(next)); });
test('SQL foreign keys reject cross-shop order references', async () => { const db = dbAdapter(); const repo = new Repository(db); await repo.initialize(); const f = fixture(); await repo.save(f.state); await assert.rejects(db.runAsync('INSERT INTO Orders(id,shop_id,customer_id,delivery_date,total_minor,data) VALUES (?,?,?,?,?,?)', 'bad', 'wrong', f.customerId, '2026-12-01', 0, '{}')); });
test('failed aggregate write rolls back all records and change events', async () => { const db = dbAdapter(); const repo = new Repository(db); await repo.initialize(); const f = fixture(); await db.execAsync("CREATE TRIGGER fail_customer BEFORE INSERT ON Customers BEGIN SELECT RAISE(ABORT,'test failure'); END;"); await assert.rejects(repo.save(f.state)); assert.equal((await repo.load()).shops.length, 0); assert.equal((await db.getAllAsync('SELECT * FROM SyncChanges')).length, 0); });
test('save retry is idempotent and device settings are separate', async () => { const db = dbAdapter(); const repo = new Repository(db); await repo.initialize(); const f = fixture(); await repo.save(f.state); const a = await db.getAllAsync('SELECT * FROM SyncChanges'); await repo.save(f.state); assert.equal((await db.getAllAsync('SELECT * FROM SyncChanges')).length, a.length); await repo.saveDevice({ deviceId: 'a', language: 'ur', activeShopId: f.shopId }); assert.equal((await repo.getDevice())?.language, 'ur'); assert.equal((await db.getAllAsync('SELECT * FROM SyncChanges')).length, a.length); });

