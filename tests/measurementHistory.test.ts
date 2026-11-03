import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { emptyWorkshop, type Field } from '../src/domain/model.ts';
import { createShop, saveCustomer, saveMeasurement, saveTemplate } from '../src/domain/services.ts';
import { copyMeasurement, compareMeasurements, measurementHistory } from '../src/domain/measurementHistory.ts';
const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'qa' };
function fixture() {
    const a = createShop(emptyWorkshop(), ctx, { name: 'Shop', ownerName: 'Owner', phone: '0', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']);
    const c = saveCustomer(a.state, ctx, a.shopId, { name: 'Ali', phone: '', address: '', notes: '' });
    const m = saveMeasurement(c.state, ctx, a.shopId, c.customerId, c.state.templates[0].id, { length: 42, chest: 40, shoulder: 18, sleeve: 24, collar: 'Ban' });
    return { ...m, shopId: a.shopId, customerId: c.customerId, templateId: c.state.templates[0].id };
}
test('copy saves a fresh immutable measurement and retains history without editing the source', () => {
    const f = fixture(); const original = JSON.stringify(f.state);
    const draft = copyMeasurement(f.state, f.shopId, f.customerId, f.measurementId);
    assert.equal(draft.values.length, 42);
    draft.values.chest = 41;
    const saved = saveMeasurement(f.state, ctx, f.shopId, f.customerId, draft.templateId, draft.values);
    assert.notEqual(saved.measurementId, f.measurementId); assert.equal(saved.state.measurements.length, 2);
    assert.equal(saved.state.measurements[0].values.chest, 40); assert.equal(saved.state.measurements[1].values.chest, 41);
    assert.equal(JSON.stringify(f.state), original);
    const rows = compareMeasurements(saved.state, f.shopId, f.customerId, f.measurementId, saved.measurementId);
    assert.equal(rows.find(r => r.field.fieldKey === 'chest')?.delta, 1);
    assert.equal(rows.filter(r => r.changed).length, 1);
});
test('copy migrates by stable keys, converts units and skips incompatible types/options', () => {
    const f = fixture(); const old = f.state.templateVersions[0];
    const fields = old.fields.map(v => ({ ...v, unit: v.unit ? 'cm' as const : undefined, ...(v.fieldKey === 'collar' ? { options: ['Different'] } : {}) }));
    const state = saveTemplate(f.state, ctx, f.shopId, 'Qameez', 'قمیض', fields, f.templateId);
    const draft = copyMeasurement(state, f.shopId, f.customerId, f.measurementId);
    assert.equal(draft.target.version, 2); assert.equal(draft.values.length, 106.68);
    assert.equal(draft.values.collar, undefined); assert.equal(draft.skipped, 1);
    const saved = saveMeasurement(state, ctx, f.shopId, f.customerId, f.templateId, { ...draft.values, chest: 103.6 });
    const rows = compareMeasurements(saved.state, f.shopId, f.customerId, f.measurementId, saved.measurementId);
    assert.equal(rows.find(r => r.field.fieldKey === 'length')?.changed, false);
    assert.equal(rows.find(r => r.field.fieldKey === 'chest')?.delta, 2);
    assert.equal(f.state.measurements[0].units.length, 'inch');
});
test('comparison preserves added/removed fields, false and zero; copy rejects another customer/shop', () => {
    const f = fixture();
    const number: Field = { id: randomUUID(), fieldKey: 'zero', type: 'decimal', labels: { en: 'Zero' }, enabled: true, required: false, options: [], order: 30, helperText: '' };
    const checkbox: Field = { ...number, id: randomUUID(), fieldKey: 'flag', type: 'checkbox', labels: { en: 'Flag' } };
    const a = saveTemplate(f.state, ctx, f.shopId, 'Qameez', '', [...f.state.templateVersions[0].fields, number, checkbox], f.templateId);
    const m = saveMeasurement(a, ctx, f.shopId, f.customerId, f.templateId, { length: 42, chest: 40, shoulder: 18, sleeve: 24, zero: 0, flag: false });
    const draft = copyMeasurement(m.state, f.shopId, f.customerId, m.measurementId);
    assert.equal(draft.values.zero, 0); assert.equal(draft.values.flag, false);
    const rows = compareMeasurements(m.state, f.shopId, f.customerId, f.measurementId, m.measurementId);
    assert.equal(rows.find(r => r.field.fieldKey === 'flag')?.oldField, undefined);
    assert.equal(rows.find(r => r.field.fieldKey === 'zero')?.after, 0);
    assert.throws(() => copyMeasurement(m.state, 'other-shop', f.customerId, m.measurementId), /copyUnavailable/);
    assert.throws(() => copyMeasurement(m.state, f.shopId, 'other-customer', m.measurementId), /copyUnavailable/);
    assert.equal(measurementHistory(m.state, 'other-shop', f.customerId).length, 0);
    assert.throws(() => compareMeasurements(m.state, f.shopId, 'other-customer', f.measurementId, m.measurementId), /comparisonUnavailable/);
});
test('removed fields remain visible in comparisons and retyped fields are not copied blindly', () => {
    const f = fixture();
    const changed = f.state.templateVersions[0].fields.filter(v => v.fieldKey !== 'collar').map(v => v.fieldKey === 'length' ? { ...v, type: 'text' as const, unit: undefined } : v);
    const state = saveTemplate(f.state, ctx, f.shopId, 'Qameez', '', changed, f.templateId);
    const draft = copyMeasurement(state, f.shopId, f.customerId, f.measurementId);
    assert.equal(draft.values.length, undefined); assert.equal(draft.skipped, 1);
    const saved = saveMeasurement(state, ctx, f.shopId, f.customerId, f.templateId, { ...draft.values, length: 'Long fit' });
    const rows = compareMeasurements(saved.state, f.shopId, f.customerId, f.measurementId, saved.measurementId);
    const collar = rows.find(r => r.field.fieldKey === 'collar')!;
    assert.equal(collar.before, 'Ban'); assert.equal(collar.newField, undefined); assert.equal(collar.changed, true);
    assert.equal(rows.find(r => r.field.fieldKey === 'length')?.delta, null);
});
