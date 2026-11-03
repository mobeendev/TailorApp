import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('every English interface key has nonempty Urdu text without Hindi-script fallback', () => {
    const en = JSON.parse(readFileSync(new URL('../src/localization/en.json', import.meta.url), 'utf8'));
    const ur = JSON.parse(readFileSync(new URL('../src/localization/ur.json', import.meta.url), 'utf8'));
    for (const key of Object.keys(en)) {
        assert.equal(typeof ur[key], 'string', `Missing Urdu translation: ${key}`);
        assert.ok(ur[key].trim(), `Empty Urdu translation: ${key}`);
        assert.doesNotMatch(ur[key], /[\u0900-\u097F]/u, `Hindi-script text in Urdu: ${key}`);
    }
    assert.equal(ur.deviceLanguage, 'ایپ کی زبان');
});
