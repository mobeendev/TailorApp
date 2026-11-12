import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { emptyWorkshop, type Workshop } from '../src/domain/model.ts';
import { createShop, saveCustomer, saveMeasurement } from '../src/domain/services.ts';
import { nextSerialNumber, withRecordDefaults } from '../src/domain/recordDefaults.ts';
const ctx = { id: randomUUID, now: () => '2026-11-05T12:00:00Z', deviceId: 'serial-test' };
const profile = { name: 'Shop', ownerName: 'Owner', phone: '123', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' as const };
function setup() {
    const { state, shopId } = createShop(emptyWorkshop(), ctx, profile, ['shalwar-kameez']);
    const customer = saveCustomer(state, ctx, shopId, { name: 'Ali', phone: '0300', address: '', notes: '' });
    const template = customer.state.templates[0];
    const fields = customer.state.templateVersions[0].fields;
    const required = Object.fromEntries(fields.filter(f => f.enabled && f.required).map(f => [f.fieldKey, f.type === 'select' || f.type === 'radio' ? f.options[0] : '40']));
    const record = (data: Workshop, serial: string) => saveMeasurement(data, ctx, shopId, customer.customerId, template.id, { ...required, serial_number: serial }).state;
    return { data: customer.state, shopId, fields, record };
}
test('the first serial number in a shop is 1', () => {
    const { data, shopId } = setup();
    assert.equal(nextSerialNumber(data, shopId), '1');
});
test('serial numbers continue after the highest numeric serial, including Urdu digits', () => {
    const { data, shopId, record } = setup();
    let next = record(data, '7');
    next = record(next, '۱۲');
    next = record(next, 'A-99');
    assert.equal(nextSerialNumber(next, shopId), '13');
});
test('serial numbers are counted per shop', () => {
    const { data, shopId, record } = setup();
    const withSerial = record(data, '40');
    const other = createShop(withSerial, ctx, { ...profile, name: 'Second' }, ['shalwar-kameez']);
    assert.equal(nextSerialNumber(other.state, other.shopId), '1');
    assert.equal(nextSerialNumber(other.state, shopId), '41');
});
test('new records get the next serial and today; entered values are kept', () => {
    const { data, shopId, fields } = setup();
    assert.deepEqual(withRecordDefaults(fields, { length: '40' }, data, shopId, '2026-11-05'), { length: '40', serial_number: '1', measurement_date: '2026-11-05' });
    assert.deepEqual(withRecordDefaults(fields, { serial_number: '51', measurement_date: '2026-10-31' }, data, shopId, '2026-11-05'), { serial_number: '51', measurement_date: '2026-10-31' });
});
test('disabled or missing record fields are not filled', () => {
    const { data, shopId, fields } = setup();
    const disabled = fields.map(f => ['serial_number', 'measurement_date'].includes(f.fieldKey) ? { ...f, enabled: false } : f);
    assert.deepEqual(withRecordDefaults(disabled, {}, data, shopId, '2026-11-05'), {});
    assert.deepEqual(withRecordDefaults([], {}, data, shopId, '2026-11-05'), {});
});
