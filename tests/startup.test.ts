import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { emptyWorkshop } from '../src/domain/model.ts';
import { createShop, saveCustomer } from '../src/domain/services.ts';
import { resolveStartup, startupError } from '../src/domain/startup.ts';
import { Repository, type DB } from '../src/database/repository.ts';
const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'device' };
const profile = { name: 'Original Shop', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' as const };
test('startup resumes completed shop even when first shop is unfinished or selected id is missing', () => { const a = createShop(emptyWorkshop(), ctx, profile, ['kameez']); a.state.shops[0].setupComplete = false; const b = createShop(a.state, ctx, { ...profile, name: 'Saved Shop' }, ['shalwar']); const device = { deviceId: 'device', language: 'ur' as const, activeShopId: a.shopId }; const selected = resolveStartup(b.state, device); assert.equal(selected.activeShopId, b.shopId); assert.equal(selected.language, 'ur'); assert.equal(resolveStartup(b.state, { ...device, activeShopId: 'missing' }).activeShopId, b.shopId); });
test('multiple completed shops with missing selection require explicit selection and do not create data', () => { const a = createShop(emptyWorkshop(), ctx, profile, ['kameez']); const b = createShop(a.state, ctx, profile, ['shalwar']); assert.equal(resolveStartup(b.state, { deviceId: 'device', language: 'ur', activeShopId: 'missing' }).activeShopId, ''); assert.equal(b.state.shops.length, 2); assert.equal(resolveStartup(b.state, { deviceId: 'device', language: 'ur', activeShopId: b.shopId }).activeShopId, b.shopId); });
test('locked storage produces recovery instructions instead of onboarding', () => { assert.equal(startupError(new Error('Access Handles cannot be created')), 'storageBusy'); });
function adapter(db: DatabaseSync): DB { return { execAsync: async (s) => { db.exec(s); }, runAsync: async (s, ...p) => db.prepare(s).run(...p), getAllAsync: async <T>(s: string, ...p: (string | number | null)[]) => db.prepare(s).all(...p) as T[], withTransactionAsync: async (fn) => { db.exec('BEGIN'); try {
        await fn();
        db.exec('COMMIT');
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    } } }; }
test('closing and reopening real SQLite file preserves shop, customer and Urdu device preference', async () => { const dir = mkdtempSync(join(tmpdir(), 'tailor-persist-')); try {
    const file = join(dir, 'test.db');
    let db = new DatabaseSync(file);
    let repo = new Repository(adapter(db));
    await repo.initialize();
    const a = createShop(emptyWorkshop(), ctx, profile, ['kameez']);
    const c = saveCustomer(a.state, ctx, a.shopId, { name: 'Existing Customer', phone: '', address: '', notes: '' });
    await repo.save(c.state);
    await repo.saveDevice({ deviceId: 'device', language: 'ur', activeShopId: a.shopId, theme: 'indigo' });
    db.close();
    db = new DatabaseSync(file);
    repo = new Repository(adapter(db));
    await repo.initialize();
    const snapshot = await repo.load();
    const settings = resolveStartup(snapshot, (await repo.getDevice())!);
    assert.equal(snapshot.shops[0].setupComplete, true);
    assert.equal(snapshot.customers[0].name, 'Existing Customer');
    assert.equal(settings.activeShopId, a.shopId);
    assert.equal(settings.language, 'ur');
    assert.equal(settings.theme, 'indigo');
    db.close();
}
finally {
    rmSync(dir, { recursive: true });
} });
test('old and invalid theme preferences fall back to heritage without changing language or shop', async () => { const { getPalette, normalizeTheme } = await import('../src/domain/themes.ts'); const a = createShop(emptyWorkshop(), ctx, profile, ['kameez']); const old = resolveStartup(a.state, { deviceId: 'device', language: 'ur', activeShopId: a.shopId }); assert.equal(old.theme, 'heritage'); assert.equal(old.language, 'ur'); assert.equal(old.activeShopId, a.shopId); assert.equal(normalizeTheme('unknown'), 'heritage'); assert.notEqual(getPalette('indigo').navy, getPalette('rose').navy); });

