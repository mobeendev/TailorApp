import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { migrateLegacy } from '../src/database/legacy.ts';
const ctx = { id: randomUUID, now: () => new Date('2026-10-27').toISOString(), deviceId: 'test' };
test('legacy import preserves customers, units and status without inventing prices', () => { const result = migrateLegacy(JSON.stringify({ version: 1, urdu: true, customers: [{ id: 1, name: 'Demo', phone: '', chest: '40', waist: '34', length: '42' }], orders: [{ id: 2, customerId: 1, garment: 'Thobe', status: 1 }] }), ctx); assert.equal(result.language, 'ur'); assert.equal(result.state.customers[0].name, 'Demo'); assert.equal(result.state.measurements[0].values.chest, 40); assert.equal(result.state.measurements[0].units.chest, 'inch'); assert.equal(result.state.orders[0].status, 'in_progress'); assert.equal(result.state.orderItems[0].garment, 'Thobe'); assert.equal(result.state.shops[0].setupComplete, false); });
test('invalid legacy data is not silently discarded', () => { assert.throws(() => migrateLegacy('{"version":1,"urdu":false,"customers":[{}],"orders":[]}', ctx)); });

