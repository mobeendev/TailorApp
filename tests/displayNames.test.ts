import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayTimestamp, garmentName, optionName } from '../src/domain/displayNames.ts';

test('Urdu display labels preserve stored/custom values and other languages', () => {
    assert.equal(garmentName('Kameez Only', 'ur'), 'صرف قمیض');
    assert.equal(garmentName('Kameez Only', 'en'), 'Kameez Only');
    assert.equal(garmentName('Customer custom garment', 'ur'), 'Customer custom garment');
    assert.equal(optionName('Simple', 'ur', 'collar'), 'سادہ');
    assert.equal(optionName('Simple', 'ur', 'notes'), 'Simple');
    assert.equal(optionName('Custom style', 'ur', 'style'), 'Custom style');
    assert.doesNotMatch(displayTimestamp('2026-10-31T06:00:00.000Z', 'ur'), /\b(?:AM|PM)\b/);
});
