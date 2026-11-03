import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { emptyWorkshop } from '../src/domain/model.ts';
import { createOrder, createShop, saveCustomer, saveMeasurement } from '../src/domain/services.ts';
import { addPaperFormFields } from '../src/domain/paperForm.ts';
import { copyMeasurement, measurementVersion } from '../src/domain/measurementHistory.ts';
import { Repository, type DB } from '../src/database/repository.ts';
const ctx = { id: randomUUID, now: () => '2026-10-31T12:00:00Z', deviceId: 'paper-test' };
const profile = { name: 'Shop', ownerName: 'Owner', phone: '123', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' as const };
const additions = ['serial_number', 'measurement_date', 'shirt_length', 'waistcoat_length', 'front', 'side', 'hip_detail', 'collar_band', 'plate'];
function adapter(db: DatabaseSync): DB { return { execAsync: async s => { db.exec(s); }, runAsync: async (s, ...p) => db.prepare(s).run(...p), getAllAsync: async <T>(s: string, ...p: (string | number | null)[]) => db.prepare(s).all(...p) as T[], withTransactionAsync: async f => { db.exec('BEGIN'); try { await f(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } } }; }

test('paper form fields are available for new shops, with appropriate types and without required extra measurements', () => {
    const shop = createShop(emptyWorkshop(), ctx, profile, ['shalwar-kameez']);
    const fields = shop.state.templateVersions[0].fields;
    for (const key of additions) assert.equal(fields.filter(f => f.fieldKey === key).length, 1);
    assert.equal(fields.find(f => f.fieldKey === 'measurement_date')?.type, 'date');
    assert.equal(fields.find(f => f.fieldKey === 'collar_band')?.type, 'decimal');
    assert.ok(additions.every(key => !fields.find(f => f.fieldKey === key)!.required));
    assert.strictEqual(addPaperFormFields(shop.state, ctx), shop.state);
});

test('upgrading existing templates preserves customized fields, old measurements and order links across SQLite', async () => {
    const shop = createShop(emptyWorkshop(), ctx, profile, ['shalwar-kameez']);
    const old = structuredClone(shop.state);
    old.templateVersions[0].fields = old.templateVersions[0].fields.filter(f => !additions.includes(f.fieldKey));
    old.templateVersions[0].fields.find(f => f.fieldKey === 'waist')!.enabled = false;
    const customer = saveCustomer(old, ctx, shop.shopId, { name: 'Ali', phone: '', address: '', notes: '' });
    const measurement = saveMeasurement(customer.state, ctx, shop.shopId, customer.customerId, old.templates[0].id, { length: 42, chest: 40, shoulder: 18, sleeve: 24, shalwar_length: 39 });
    const order = createOrder(measurement.state, ctx, shop.shopId, customer.customerId, [{ measurementId: measurement.measurementId, quantity: 1 }], '2026-11-02', '5000', '0', '');
    const before = structuredClone(order.state);
    const upgraded = addPaperFormFields(before, ctx);
    assert.equal(upgraded.templates[0].activeVersion, 2);
    assert.deepEqual(upgraded.templateVersions[0], before.templateVersions[0]);
    assert.deepEqual(upgraded.measurements, before.measurements);
    assert.deepEqual(upgraded.orderItems, before.orderItems);
    assert.equal(upgraded.templateVersions[1].fields.find(f => f.fieldKey === 'waist')?.enabled, false);
    assert.equal(measurementVersion(upgraded, upgraded.measurements[0])?.version, 1);
    const draft = copyMeasurement(upgraded, shop.shopId, customer.customerId, measurement.measurementId);
    assert.equal(draft.values.chest, 40);
    const newMeasurement = saveMeasurement(upgraded, ctx, shop.shopId, customer.customerId, old.templates[0].id, { ...draft.values, serial_number: '51', measurement_date: '2026-10-31', front: '2', collar_band: '17.5' });
    assert.equal(newMeasurement.state.measurements[1].values.collar_band, 17.5);
    const copiedAgain = copyMeasurement(newMeasurement.state, shop.shopId, customer.customerId, newMeasurement.measurementId);
    assert.equal(copiedAgain.values.serial_number, undefined);
    assert.equal(copiedAgain.values.measurement_date, undefined);
    assert.equal(copiedAgain.values.collar_band, 17.5);
    const db = new DatabaseSync(':memory:');
    try { const repo = new Repository(adapter(db)); await repo.initialize(); await repo.save(before); await repo.save(newMeasurement.state); const loaded = await repo.load(); assert.deepEqual(loaded.orderItems, before.orderItems); assert.equal(loaded.measurements[0].values.chest, 40); assert.equal(loaded.measurements[1].values.serial_number, '51'); } finally { db.close(); }
});
