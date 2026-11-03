import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { addTestData } from '../src/domain/testData.ts';
import { createShop, saveCustomer } from '../src/domain/services.ts';
import { emptyWorkshop } from '../src/domain/model.ts';
const ctx = { id: randomUUID, now: () => new Date('2026-10-30T12:00:00Z').toISOString(), deviceId: 'test' };
for (const defaultUnit of ['inch', 'cm'] as const)
    test(`test fixtures preserve existing data, add exact counts and are repeat-safe (${defaultUnit})`, () => { const shop = createShop(emptyWorkshop(), ctx, { name: 'Shop', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit }, ['kameez']); const existing = saveCustomer(shop.state, ctx, shop.shopId, { name: 'Existing', phone: '', address: '', notes: '' }); const result = addTestData(existing.state, ctx, shop.shopId); assert.equal(result.customers.length - existing.state.customers.length, 17); assert.equal(result.customers.filter(c => c.notes.includes('Synthetic male')).length, 10); assert.equal(result.customers.filter(c => c.notes.includes('Synthetic female')).length, 7); assert.equal(result.orders.length, 50); assert.equal(result.measurements.length, 17); for (const status of ['new', 'in_progress', 'ready', 'delivered', 'cancelled'])
        assert.equal(result.orders.filter(o => o.status === status).length, 10); assert.deepEqual(result.customers[0], existing.state.customers[0]); assert.equal(addTestData(result, ctx, shop.shopId), result); assert.ok(result.measurements.every(m => m.units.chest === defaultUnit)); });
test('saved JSON fixtures contain the same 17 customers and valid related data', async () => { const { readFileSync } = await import('node:fs'); const { validateWorkshop } = await import('../src/domain/validation.ts'); const snapshot = JSON.parse(readFileSync(new URL('../fixtures/test-workshop.json', import.meta.url), 'utf8')); const customers = JSON.parse(readFileSync(new URL('../fixtures/customers.json', import.meta.url), 'utf8')); validateWorkshop(snapshot); assert.deepEqual(customers, snapshot.customers); assert.equal(customers.length, 17); assert.equal(snapshot.orders.length, 50); assert.equal(snapshot.measurements.length, 17); });

