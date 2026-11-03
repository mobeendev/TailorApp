import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { emptyWorkshop } from '../src/domain/model.ts';
import { createShop, saveCustomer, saveMeasurement, createOrder } from '../src/domain/services.ts';
import { receiptHtml } from '../src/services/receipt.ts';
test('receipt contains balances, shop branding, quantity, RTL and escaped user text', () => { const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'test' }; const a = createShop(emptyWorkshop(), ctx, { name: '<script>bad</script>', ownerName: 'Owner', phone: '000', address: 'Lahore', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']); const c = saveCustomer(a.state, ctx, a.shopId, { name: 'Ali & Sons', phone: '123', address: '', notes: '' }); const m = saveMeasurement(c.state, ctx, a.shopId, c.customerId, c.state.templates[0].id, { length: 42, chest: 40, shoulder: 18, sleeve: 24 }); const o = createOrder(m.state, ctx, a.shopId, c.customerId, [{ measurementId: m.measurementId, quantity: 2 }], '2026-12-01', '100.10', '20.05', '<img onerror=bad>'); const html = receiptHtml(o.state, o.orderId, 'ur', k => k); assert.ok(html.includes('dir="rtl"')); assert.ok(html.includes('80.05')); assert.ok(html.includes('Ali &amp; Sons')); assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>')); assert.ok(html.includes('<td>2</td>')); });

